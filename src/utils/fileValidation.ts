/**
 * Validates the file type by reading its magic bytes (file signature).
 * Supports PDF, PNG, JPEG, GIF, WEBP, MP4, ZIP, and DOCX.
 */

const MAGIC_BYTES = {
  PDF: [0x25, 0x50, 0x44, 0x46], // %PDF
  PNG: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  JPEG: [0xFF, 0xD8, 0xFF],
  GIF: [0x47, 0x49, 0x46, 0x38], // GIF8
  WEBP: [0x52, 0x49, 0x46, 0x46, undefined, undefined, undefined, undefined, 0x57, 0x45, 0x42, 0x50], // RIFF...WEBP
  ZIP: [0x50, 0x4B, 0x03, 0x04], // ZIP (Also DOCX, XLSX, PPTX)
  MP4: [undefined, undefined, undefined, undefined, 0x66, 0x74, 0x79, 0x70], // ....ftyp
}

function checkMagicBytes(buffer: Uint8Array, signature: (number | undefined)[]): boolean {
  if (buffer.length < signature.length) return false
  for (let i = 0; i < signature.length; i++) {
    if (signature[i] !== undefined && buffer[i] !== signature[i]) {
      return false
    }
  }
  return true
}

export async function validateFileType(file: File): Promise<void> {
  const headerSize = 16
  const slice = file.slice(0, headerSize)
  const buffer = new Uint8Array(await slice.arrayBuffer())

  const isValid =
    checkMagicBytes(buffer, MAGIC_BYTES.PDF) ||
    checkMagicBytes(buffer, MAGIC_BYTES.PNG) ||
    checkMagicBytes(buffer, MAGIC_BYTES.JPEG) ||
    checkMagicBytes(buffer, MAGIC_BYTES.GIF) ||
    checkMagicBytes(buffer, MAGIC_BYTES.WEBP) ||
    checkMagicBytes(buffer, MAGIC_BYTES.ZIP) ||
    checkMagicBytes(buffer, MAGIC_BYTES.MP4)

  if (!isValid) {
    throw new Error(
      `File type not supported or corrupted. Allowed types: PDF, PNG, JPEG, GIF, WEBP, MP4, ZIP/DOCX.`
    )
  }
}
