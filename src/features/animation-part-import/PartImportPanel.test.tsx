import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { parseAnimationPartAsset } from "../../schemas";
import { createAnimationPartAssetInput } from "../../test/animationSchemaFixtures";
import { PNG_SIGNATURE } from "./partImport";
import { PartImportPanel } from "./PartImportPanel";

function file(name = "helmet.png") {
  return new File([new Uint8Array(PNG_SIGNATURE)], name, { type: "image/png" });
}

function decoder() {
  const pixels = new Uint8ClampedArray(3 * 2 * 4);
  pixels[3] = 255;
  pixels[4 * 4 + 3] = 100;
  return { decode: vi.fn().mockResolvedValue({ width: 3, height: 2, pixels }) };
}

function objectUrls() {
  return {
    createObjectURL: vi.fn().mockReturnValue("blob:preview"),
    revokeObjectURL: vi.fn()
  };
}

describe("PartImportPanel", () => {
  it("offers the keyboard file input, previews metadata and confirms a replacement", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn().mockImplementation(async (definition) => ({
      status: "ok",
      partAsset: parseAnimationPartAsset(
        createAnimationPartAssetInput({
          assetId: "part_imported_001",
          blobId: "blob_imported_001",
          label: definition.label,
          anchorStatus: "anchorsPending",
          anchors: undefined
        })
      )
    }));
    const existingPart = parseAnimationPartAsset(createAnimationPartAssetInput());
    const factory = objectUrls();
    render(
      <PartImportPanel
        selectedSlot="head"
        selectedSlotLabel="Kopf"
        direction="south"
        directionLabel="Süd"
        decoder={decoder()}
        existingPart={existingPart}
        onCommit={onCommit}
        objectUrlFactory={factory}
      />
    );

    const input = screen.getByLabelText("PNG-Datei auswählen");
    input.focus();
    expect(input).toHaveFocus();
    await user.upload(input, file());

    expect(await screen.findByAltText("Vorschau helmet.png")).toHaveAttribute("src", "blob:preview");
    expect(screen.getByText("3 × 2 px")).toBeVisible();
    expect(screen.getByText(/X 0, Y 0, 2 × 2 px/)).toBeVisible();
    expect(screen.getByText(/opakes Pixel berührt/)).toBeVisible();
    expect(screen.getByText(/bisherige Quelle/)).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Import bestätigen" }));
    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
    expect(onCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "helmet",
        slot: "head",
        direction: "south",
        replacedAssetId: existingPart.assetId,
        trimRect: { x: 0, y: 0, width: 2, height: 2 }
      })
    );
    expect(await screen.findByText(/wurde importiert/)).toHaveAttribute("role", "status");
    expect(factory.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });

  it("accepts drop as an additive path and cancel revokes the transient preview", async () => {
    const user = userEvent.setup();
    const factory = objectUrls();
    const onCommit = vi.fn();
    render(
      <PartImportPanel
        selectedSlot="torso"
        selectedSlotLabel="Torso"
        direction="east"
        directionLabel="Ost"
        decoder={decoder()}
        existingPart={null}
        onCommit={onCommit}
        objectUrlFactory={factory}
      />
    );

    fireEvent.drop(screen.getByText("PNG hier ablegen").parentElement!, {
      dataTransfer: { files: [file("torso.png")] }
    });
    expect(await screen.findByText("torso.png")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Abbrechen" }));
    expect(screen.queryByText("torso.png")).not.toBeInTheDocument();
    expect(onCommit).not.toHaveBeenCalled();
    expect(factory.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });

  it("keeps a prepared draft visible when repository confirmation fails", async () => {
    const user = userEvent.setup();
    render(
      <PartImportPanel
        selectedSlot="head"
        selectedSlotLabel="Kopf"
        direction="south"
        directionLabel="Süd"
        decoder={decoder()}
        existingPart={null}
        onCommit={vi.fn().mockResolvedValue({
          status: "error",
          message: "Die IndexedDB-Transaktion ist fehlgeschlagen."
        })}
        objectUrlFactory={objectUrls()}
      />
    );

    await user.upload(screen.getByLabelText("PNG-Datei auswählen"), file());
    await user.click(await screen.findByRole("button", { name: "Import bestätigen" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("IndexedDB-Transaktion");
    expect(screen.getByText("helmet.png")).toBeVisible();
  });

  it("requires a keyboard-selectable attachment joint for free accessories", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn().mockImplementation(async (definition) => ({
      status: "ok",
      partAsset: parseAnimationPartAsset(
        createAnimationPartAssetInput({
          assetId: "part_accessory_imported_001",
          blobId: "blob_accessory_imported_001",
          label: definition.label,
          slot: "accessory.1",
          attachmentJointId: definition.attachmentJointId,
          anchorStatus: "anchorsPending",
          anchors: undefined
        })
      )
    }));
    render(
      <PartImportPanel
        selectedSlot="accessory.1"
        selectedSlotLabel="Accessoire 1"
        direction="south"
        directionLabel="Süd"
        decoder={decoder()}
        existingPart={null}
        onCommit={onCommit}
        objectUrlFactory={objectUrls()}
      />
    );

    expect(screen.getByText("Default-LayerGroup: frontEquipment")).toBeVisible();
    await user.upload(screen.getByLabelText("PNG-Datei auswählen"), file("amulet.png"));
    await user.click(await screen.findByRole("button", { name: "Import bestätigen" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Attachment-Joint");
    expect(onCommit).not.toHaveBeenCalled();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Attachment-Joint" }),
      "chest"
    );
    await user.click(screen.getByRole("button", { name: "Import bestätigen" }));
    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
    expect(onCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        slot: "accessory.1",
        attachmentJointId: "chest"
      })
    );
  });
});
