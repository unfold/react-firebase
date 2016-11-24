import { initializeApp } from 'firebase/app'
import 'firebase/database'

export const getSandboxedPath = path => `${process.env.SANDBOX_PATH}/${path}`
export const initializeDemoApp = () => initializeApp({
  databaseURL: 'https://react-firebase-sandbox.firebaseio.com',
})
