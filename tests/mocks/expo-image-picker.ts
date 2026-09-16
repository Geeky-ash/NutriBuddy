export const MediaTypeOptions = {
  All: 'All',
  Videos: 'Videos',
  Images: 'Images',
};

export const requestMediaLibraryPermissionsAsync = jest.fn(async () => ({
  granted: true,
  status: 'granted',
}));

export const requestCameraPermissionsAsync = jest.fn(async () => ({
  granted: true,
  status: 'granted',
}));

export const launchImageLibraryAsync = jest.fn(async () => ({
  canceled: false,
  assets: [{ uri: 'file:///mock-avatar.jpg' }],
}));

export const launchCameraAsync = jest.fn(async () => ({
  canceled: false,
  assets: [{ uri: 'file:///mock-camera.jpg' }],
}));

export default {
  MediaTypeOptions,
  requestMediaLibraryPermissionsAsync,
  requestCameraPermissionsAsync,
  launchImageLibraryAsync,
  launchCameraAsync,
};
