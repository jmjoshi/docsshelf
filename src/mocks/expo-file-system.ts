// Mock implementation for expo-file-system
export const documentDirectory = '/mock/documents/';

export interface FileInfo {
  exists: boolean;
  uri: string;
  size?: number;
  modificationTime?: number;
  md5?: string;
}

export const readAsStringAsync = async (uri: string): Promise<string> => {
  console.log('Mock FileSystem: readAsStringAsync', uri);
  return '';
};

export const writeAsStringAsync = async (uri: string, content: string): Promise<void> => {
  console.log('Mock FileSystem: writeAsStringAsync', { uri, contentLength: content.length });
};

export const deleteAsync = async (uri: string): Promise<void> => {
  console.log('Mock FileSystem: deleteAsync', uri);
};

export const makeDirectoryAsync = async (uri: string): Promise<void> => {
  console.log('Mock FileSystem: makeDirectoryAsync', uri);
};

export const getInfoAsync = async (uri: string): Promise<FileInfo> => {
  console.log('Mock FileSystem: getInfoAsync', uri);
  return {
    exists: false,
    uri,
  };
};

export const readDirectoryAsync = async (uri: string): Promise<string[]> => {
  console.log('Mock FileSystem: readDirectoryAsync', uri);
  return [];
};