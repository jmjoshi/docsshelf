// Mock implementation for expo-image-picker
export interface ImagePickerResult {
  cancelled: boolean;
  uri?: string;
  width?: number;
  height?: number;
  type?: string;
}

export const launchImageLibraryAsync = async (): Promise<ImagePickerResult> => {
  console.log('Mock ImagePicker: launchImageLibraryAsync called');
  return {
    cancelled: true,
  };
};

export const launchCameraAsync = async (): Promise<ImagePickerResult> => {
  console.log('Mock ImagePicker: launchCameraAsync called');
  return {
    cancelled: true,
  };
};

export const requestMediaLibraryPermissionsAsync = async () => {
  console.log('Mock ImagePicker: requestMediaLibraryPermissionsAsync called');
  return { granted: false };
};

export const requestCameraPermissionsAsync = async () => {
  console.log('Mock ImagePicker: requestCameraPermissionsAsync called');
  return { granted: false };
};