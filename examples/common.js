import { initializeApp } from 'firebase'

export const getSandBoxedPath = path => `${process.env.SANDBOX_PATH}/${path}`
export const initializeDemoDatabase = () => {
  const app = initializeApp({
    databaseURL: 'https://react-firebase-sandbox.firebaseio.com',
  })

  return app.database()
}
