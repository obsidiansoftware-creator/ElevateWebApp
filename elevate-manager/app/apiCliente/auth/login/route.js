import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Datos incompletos' },
        { status: 400 }
      )
    }

    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ? AND deleted_at IS NULL',
      [email]
    )

    if (!rows.length) {
      return NextResponse.json(
        { message: 'Usuario no existe' },
        { status: 401 }
      )
    }

    const user = rows[0]

    if (user.estatus !== 'activo') {
      return NextResponse.json(
        { message: 'Usuario inactivo o bloqueado' },
        { status: 403 }
      )
    }

    const isValid = await bcrypt.compare(password, user.password_hash)

    if (!isValid) {
      return NextResponse.json(
        { message: 'Contraseña incorrecta' },
        { status: 401 }
      )
    }

    const token = jwt.sign(
      {
        id: user.id,
        rol: user.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )

    await pool.query(
      'UPDATE usuarios SET ultimo_login = NOW(), intentos_fallidos = 0 WHERE id = ?',
      [user.id]
    )

    const response = NextResponse.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol
      }
    })

    // 🍪 Guardar cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: false // ⚠ localhost
    })

    return response

  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: 'Error del servidor' },
      { status: 500 }
    )
  }
}
