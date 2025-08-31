export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Documents: undefined;
  Settings: undefined;
};

export type DocumentsStackParamList = {
  DocumentsList: undefined;
  DocumentDetail: { documentId: string };
  UploadDocument: undefined;
  ScanDocument: undefined;
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  Profile: undefined;
  Security: undefined;
  Storage: undefined;
};
