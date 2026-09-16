export const maybeCompleteAuthSession = jest.fn();
export const openAuthSessionAsync = jest.fn().mockResolvedValue({
  type: 'success',
  url: 'nutribuddy://auth#access_token=mock-google-access-token&refresh_token=mock-google-refresh-token',
});
export const dismissAuthSession = jest.fn();

export default {
  maybeCompleteAuthSession,
  openAuthSessionAsync,
  dismissAuthSession,
};
