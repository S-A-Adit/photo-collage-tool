import sharp from 'sharp';
import path from 'path';

/**
 * Stitch images together to form a collage.
 * @param {Array<Object>} files - Array of file objects from multer.
 * @param {Object} options - Collage configurations.
 * @param {string} options.layout - 'horizontal' or 'vertical'.
 * @param {number} options.borderSize - Size of borders in pixels.
 * @param {string} options.borderColor - Background/border color (hex string).
 * @param {string} outputPath - Output file path.
 */
export async function createCollage(files, options, outputPath) {
  if (!files || files.length === 0) {
    throw new Error('No images uploaded');
  }

  const layout = options.layout || 'horizontal';
  const borderSize = parseInt(options.borderSize, 10) >= 0 ? parseInt(options.borderSize, 10) : 0;
  const borderColor = options.borderColor || '#ffffff';
  const format = options.format || 'png';
  const quality = options.quality || 90;

  // Step 1: Read metadata for all images to get original sizes
  const imageMetadatas = await Promise.all(
    files.map(async (file) => {
      try {
        const metadata = await sharp(file.path).metadata();
        return {
          path: file.path,
          width: metadata.width,
          height: metadata.height,
        };
      } catch (err) {
        throw new Error(`Failed to read image metadata for ${path.basename(file.originalname)}: ${err.message}`);
      }
    })
  );

  if (layout === 'horizontal') {
    // Determine target height: use the minimum height of all images to avoid pixelated upscaling
    let targetHeight = Math.min(...imageMetadatas.map((img) => img.height));
    // Limit range to reasonable boundaries (400px - 1200px)
    targetHeight = Math.max(400, Math.min(1200, targetHeight));

    // Step 2: Resize images to the target height while maintaining aspect ratios
    const resizedImages = await Promise.all(
      imageMetadatas.map(async (img) => {
        const scale = targetHeight / img.height;
        const newWidth = Math.round(img.width * scale);
        
        // Resize and return image buffer
        const buffer = await sharp(img.path)
          .resize({
            height: targetHeight,
            width: newWidth,
            fit: 'fill',
          })
          .toBuffer();
          
        return {
          buffer,
          width: newWidth,
          height: targetHeight,
        };
      })
    );

    // Step 3: Calculate canvas dimensions
    // Width: sum of widths + (N + 1) * borderSize
    const totalWidth = resizedImages.reduce((sum, img) => sum + img.width, 0) + (resizedImages.length + 1) * borderSize;
    const totalHeight = targetHeight + 2 * borderSize;

    // Step 4: Lay out the resized image components
    let currentX = borderSize;
    const compositeList = [];
    for (const img of resizedImages) {
      compositeList.push({
        input: img.buffer,
        left: currentX,
        top: borderSize,
      });
      currentX += img.width + borderSize;
    }

    // Step 5: Create blank background and composite
    let imageInstance = sharp({
      create: {
        width: totalWidth,
        height: totalHeight,
        channels: 4,
        background: borderColor,
      },
    }).composite(compositeList);

    if (format === 'jpeg') {
      imageInstance = imageInstance.flatten({ background: borderColor }).jpeg({ quality });
    } else if (format === 'webp') {
      imageInstance = imageInstance.webp({ quality });
    } else {
      imageInstance = imageInstance.png();
    }

    await imageInstance.toFile(outputPath);

  } else {
    // Vertical Layout
    // Determine target width: use the minimum width of all images
    let targetWidth = Math.min(...imageMetadatas.map((img) => img.width));
    targetWidth = Math.max(400, Math.min(1200, targetWidth));

    // Step 2: Resize images to target width maintaining aspect ratios
    const resizedImages = await Promise.all(
      imageMetadatas.map(async (img) => {
        const scale = targetWidth / img.width;
        const newHeight = Math.round(img.height * scale);
        
        const buffer = await sharp(img.path)
          .resize({
            width: targetWidth,
            height: newHeight,
            fit: 'fill',
          })
          .toBuffer();
          
        return {
          buffer,
          width: targetWidth,
          height: newHeight,
        };
      })
    );

    // Step 3: Calculate canvas dimensions
    const totalWidth = targetWidth + 2 * borderSize;
    // Height: sum of heights + (N + 1) * borderSize
    const totalHeight = resizedImages.reduce((sum, img) => sum + img.height, 0) + (resizedImages.length + 1) * borderSize;

    // Step 4: Lay out the resized image components
    let currentY = borderSize;
    const compositeList = [];
    for (const img of resizedImages) {
      compositeList.push({
        input: img.buffer,
        left: borderSize,
        top: currentY,
      });
      currentY += img.height + borderSize;
    }

    // Step 5: Create blank background and composite
    let imageInstance = sharp({
      create: {
        width: totalWidth,
        height: totalHeight,
        channels: 4,
        background: borderColor,
      },
    }).composite(compositeList);

    if (format === 'jpeg') {
      imageInstance = imageInstance.flatten({ background: borderColor }).jpeg({ quality });
    } else if (format === 'webp') {
      imageInstance = imageInstance.webp({ quality });
    } else {
      imageInstance = imageInstance.png();
    }

    await imageInstance.toFile(outputPath);
  }
}
