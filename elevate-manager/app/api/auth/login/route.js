// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // Buscar usuario en Supabase
    const { data: rows, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .is('deleted_at', null);

    if (error) {
      console.error(error);
      return NextResponse.json(
        { message: 'Error al consultar usuario' },
        { status: 500 }
      );
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { message: 'Usuario no existe' },
        { status: 401 }
      );
    }

    const user = rows[0];

    if (user.estatus !== 'activo') {
      return NextResponse.json(
        { message: 'Usuario inactivo o bloqueado' },
        { status: 403 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return NextResponse.json(
        { message: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Generar JWT
    const token = jwt.sign(
      {
        id: user.id,
        rol: user.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Aquí no se puede hacer UPDATE directo si no quieres usar pg,
    // pero podrías usar supabase.from('usuarios').update(...) si quieres registrar último_login

    const response = NextResponse.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol
      }
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    return response;

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Error del servidor' },
      { status: 500 }
    );
  }
}