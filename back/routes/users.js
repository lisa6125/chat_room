import express from 'express'
import { create, login, logout } from '../controllers/users.js'

const router = express.Router()

router.post('/', create)
router.post('/login', login)
router.delete('/logout', logout)

export default router
