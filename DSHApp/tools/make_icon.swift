import AppKit

// Generates an AppIcon.iconset directory with PNGs at all required sizes.
// Usage: make_icon <output-dir> [output.icns] [source-image]

let outputDir = CommandLine.arguments.count > 1
    ? CommandLine.arguments[1]
    : "AppIcon.iconset"

let sourceImage: NSImage? = {
    guard CommandLine.arguments.count > 3 else { return nil }
    let path = CommandLine.arguments[3]
    guard let image = NSImage(contentsOfFile: path) else {
        fputs("failed to load icon source: \(path)\n", stderr)
        exit(1)
    }
    return image
}()

let sizes: [(name: String, px: Int)] = [
    ("icon_16x16", 16),
    ("icon_16x16@2x", 32),
    ("icon_32x32", 32),
    ("icon_32x32@2x", 64),
    ("icon_128x128", 128),
    ("icon_128x128@2x", 256),
    ("icon_256x256", 256),
    ("icon_256x256@2x", 512),
    ("icon_512x512", 512),
    ("icon_512x512@2x", 1024),
]

func drawIcon(pixels: Int) -> NSBitmapImageRep {
    let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: pixels,
        pixelsHigh: pixels,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    )!
    rep.size = NSSize(width: pixels, height: pixels)

    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)

    let rect = NSRect(x: 0, y: 0, width: pixels, height: pixels)

    // Rounded-rect mask
    let radius = CGFloat(pixels) * 0.223
    let path = NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
    path.addClip()

    if let sourceImage {
        NSColor.white.setFill()
        rect.fill()
        NSGraphicsContext.current?.imageInterpolation = .high
        sourceImage.draw(
            in: rect,
            from: NSRect(origin: .zero, size: sourceImage.size),
            operation: .sourceOver,
            fraction: 1
        )
    } else {
        // Fallback used only when no source image is supplied.
        NSColor.white.setFill()
        rect.fill()
        let fontSize = CGFloat(pixels) * 0.40
        let attributes: [NSAttributedString.Key: Any] = [
            .font: NSFont.systemFont(ofSize: fontSize, weight: .bold),
            .foregroundColor: NSColor.black,
        ]
        let text = NSAttributedString(string: "DSH", attributes: attributes)
        let textSize = text.size()
        text.draw(at: NSPoint(
            x: (CGFloat(pixels) - textSize.width) / 2,
            y: (CGFloat(pixels) - textSize.height) / 2 - CGFloat(pixels) * 0.03
        ))
    }

    NSGraphicsContext.restoreGraphicsState()

    // Clamp the generated source to neutral monochrome: pure white background,
    // solid black whale, with only grayscale antialiasing retained at edges.
    if sourceImage != nil, let bitmap = rep.bitmapData {
        for y in 0..<pixels {
            for x in 0..<pixels {
                let offset = y * rep.bytesPerRow + x * 4
                let red = Double(bitmap[offset])
                let green = Double(bitmap[offset + 1])
                let blue = Double(bitmap[offset + 2])
                let luminance = Int((0.2126 * red + 0.7152 * green + 0.0722 * blue).rounded())
                let value: UInt8
                if luminance <= 24 {
                    value = 0
                } else if luminance >= 232 {
                    value = 255
                } else {
                    value = UInt8((luminance - 24) * 255 / (232 - 24))
                }
                bitmap[offset] = value
                bitmap[offset + 1] = value
                bitmap[offset + 2] = value
            }
        }
    }
    return rep
}

let fm = FileManager.default
try? fm.createDirectory(atPath: outputDir, withIntermediateDirectories: true)

var pngByName: [String: Data] = [:]
for size in sizes {
    let rep = drawIcon(pixels: size.px)
    guard let png = rep.representation(using: .png, properties: [:]) else { continue }
    let url = URL(fileURLWithPath: outputDir).appendingPathComponent("\(size.name).png")
    try? png.write(to: url)
    pngByName[size.name] = png
}
print("iconset written to \(outputDir)")

// Some Command Line Tools-only installations reject otherwise valid iconsets.
// Build the simple PNG-backed ICNS container directly so the App always keeps
// its icon even when `iconutil` is unavailable or broken.
if CommandLine.arguments.count > 2 {
    let icnsPath = CommandLine.arguments[2]
    let chunks: [(type: String, image: String)] = [
        ("icp4", "icon_16x16"),
        ("icp5", "icon_32x32"),
        ("icp6", "icon_32x32@2x"),
        ("ic07", "icon_128x128"),
        ("ic08", "icon_256x256"),
        ("ic09", "icon_512x512"),
        ("ic10", "icon_512x512@2x"),
        ("ic11", "icon_16x16@2x"),
        ("ic12", "icon_32x32@2x"),
        ("ic13", "icon_128x128@2x"),
        ("ic14", "icon_256x256@2x"),
    ]

    func bigEndianData(_ value: Int) -> Data {
        var number = UInt32(value).bigEndian
        return Data(bytes: &number, count: MemoryLayout<UInt32>.size)
    }

    var body = Data()
    for chunk in chunks {
        guard let image = pngByName[chunk.image],
              let type = chunk.type.data(using: .ascii) else { continue }
        body.append(type)
        body.append(bigEndianData(image.count + 8))
        body.append(image)
    }

    var icns = Data("icns".utf8)
    icns.append(bigEndianData(body.count + 8))
    icns.append(body)
    do {
        try icns.write(to: URL(fileURLWithPath: icnsPath), options: .atomic)
        print("icns written to \(icnsPath)")
    } catch {
        fputs("failed to write icns: \(error)\n", stderr)
        exit(1)
    }
}
