export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  Profile: undefined;
  EditProfile: undefined;
  EmailVerification: { email?: string };
  AccountDeletion: undefined;
  ContactSupport: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  EmailVerification: { email?: string };
  ContactSupport: undefined;
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
  EditProfile: undefined;
  Security: undefined;
  Storage: undefined;
  AccountDeletion: undefined;
};
