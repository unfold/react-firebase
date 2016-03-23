import Firebase from 'firebase';

export default name => {
  const FIREBASE_URL = process.env.FIREBASE_URL;
  const exampleUrl = `${FIREBASE_URL}/${name}`;
  const demoRef = new Firebase(exampleUrl);

  console.info(`View your data at: ${FIREBASE_URL}`); // eslint-disable-line no-console

  return demoRef;
};
