// OCR service for text extraction from images
import TextRecognition from '@react-native-ml-kit/text-recognition';

export class OCRService {
  // Extract text from image using ML Kit
  static async extractTextFromImage(imagePath: string): Promise<string> {
    try {
      const result = await TextRecognition.recognize(imagePath);
      return result.text;
    } catch (error) {
      console.error('OCR text extraction failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  // Extract text blocks with bounding boxes
  static async extractTextWithBlocks(imagePath: string): Promise<{
    text: string;
    blocks: Array<{
      text: string;
      frame: { x: number; y: number; width: number; height: number };
      cornerPoints: Array<{ x: number; y: number }>;
    }>;
  }> {
    try {
      const result = await TextRecognition.recognize(imagePath);
      return {
        text: result.text,
        blocks: result.blocks.map((block) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const frame = (block.frame as any) || {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cornerPoints = (block.cornerPoints as any) || [];
          return {
            text: block.text,
            frame: {
              x: frame.x || 0,
              y: frame.y || 0,
              width: frame.width || 0,
              height: frame.height || 0,
            },
            cornerPoints: Array.isArray(cornerPoints) ? cornerPoints : [],
          };
        }),
      };
    } catch (error) {
      console.error('OCR text extraction with blocks failed:', error);
      throw new Error('Failed to extract text blocks from image');
    }
  }
}
