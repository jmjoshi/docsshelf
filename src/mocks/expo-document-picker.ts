// Mock implementation for expo-document-picker
export interface DocumentPickerResult {
  type: 'success' | 'cancel';
  uri?: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

export const getDocumentAsync = async (): Promise<DocumentPickerResult> => {
  console.log('Mock DocumentPicker: getDocumentAsync called');
  return {
    type: 'cancel',
  };
};