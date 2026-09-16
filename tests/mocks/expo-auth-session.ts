export const makeRedirectUri = jest.fn(({ scheme, path }) => {
  return `${scheme || 'nutribuddy'}://${path || 'auth'}`;
});

export default {
  makeRedirectUri,
};
