# Migración de IdentityCommandHandlers a Supabase

## Estado Actual

Los handlers en `src/modules/identity-tenancy/application/handlers/IdentityCommandHandlers.ts` actualmente usan `AuthService` (eliminado) que proporcionaba métodos como:

- `validateUser(email, password)` - Validar credenciales del usuario
- `hashPassword(password)` - Hashear contraseñas con bcrypt
- `comparePasswords(password, hash)` - Comparar contraseñas
- `generateTokens(user)` - Generar JWT access/refresh tokens
- `generatePasswordResetToken()` - Generar token de reset de contraseña

## Cambios Necesarios

### 1. LoginHandler

**Antes:**
```typescript
const user = await this.supabaseService.validateUser(email, password);
const tokens = this.supabaseService.generateTokens(user);
```

**Ahora con Supabase:**
```typescript
// Opción 1: Usar Supabase Auth directamente
const { data, error } = await this.supabaseService.signIn(email, password);
if (error) throw new UnauthorizedException('Invalid credentials');

// Obtener usuario de la BD con relaciones
const user = await this.prisma.user.findUnique({
  where: { email },
  include: { tenant: { include: { plan: true } } }
});

return {
  accessToken: data.session.access_token,
  refreshToken: data.session.refresh_token,
  user,
  tenant: user.tenant
};
```

### 2. RegisterHandler

**Antes:**
```typescript
const hashedPassword = await this.supabaseService.hashPassword(password);
// Crear usuario en BD
const tokens = this.supabaseService.generateTokens(user);
```

**Ahora con Supabase:**
```typescript
// 1. Crear usuario en Supabase Auth
const { data: authData, error } = await this.supabaseService.signUp(email, password);
if (error) throw new ConflictException('Email already registered');

// 2. Crear usuario en BD con supabase user id
const user = await this.prisma.user.create({
  data: {
    id: authData.user.id, // Usar ID de Supabase
    email,
    firstName,
    lastName,
    tenantId,
    role: 'OWNER',
    status: 'ACTIVE'
    // NO incluir hashedPassword - Supabase lo maneja
  },
  include: { tenant: { include: { plan: true } } }
});

return {
  accessToken: authData.session.access_token,
  refreshToken: authData.session.refresh_token,
  user,
  tenant: user.tenant
};
```

### 3. ChangePasswordHandler

**Antes:**
```typescript
const isValidPassword = await this.supabaseService.comparePasswords(currentPassword, user.hashedPassword);
const hashedPassword = await this.supabaseService.hashPassword(newPassword);
```

**Ahora con Supabase:**
```typescript
// Supabase maneja el cambio de contraseña directamente
// Necesitas el session token del usuario actual
const { error } = await this.supabaseService
  .getAdminClient()
  .auth
  .updateUser({ password: newPassword });

if (error) throw new BadRequestException('Failed to change password');
```

### 4. ForgotPasswordHandler

**Antes:**
```typescript
const resetToken = this.supabaseService.generatePasswordResetToken();
// Guardar token en BD
```

**Ahora con Supabase:**
```typescript
// Supabase envía email automáticamente
const { error } = await this.supabaseService
  .getClient()
  .auth
  .resetPasswordForEmail(email, {
    redirectTo: 'https://your-app.com/reset-password'
  });

if (error) throw new BadRequestException('Failed to send reset email');
```

### 5. ResetPasswordHandler

**Antes:**
```typescript
// Validar token y hashear nueva contraseña
const hashedPassword = await this.supabaseService.hashPassword(newPassword);
```

**Ahora con Supabase:**
```typescript
// El token viene del email de Supabase
// Usuario debe estar autenticado con ese token
const { error } = await this.supabaseService
  .getClient()
  .auth
  .updateUser({ password: newPassword });

if (error) throw new BadRequestException('Failed to reset password');
```

## Consideraciones Importantes

### 1. Eliminación de hashedPassword en Schema
```prisma
model User {
  id String @id // Usar UUID de Supabase Auth
  email String @unique
  // Remover: hashedPassword String?
  // Supabase Auth maneja las contraseñas
}
```

### 2. Sincronización User ID
- Los usuarios de Supabase Auth tienen UUID
- Usar el mismo ID en la tabla User de Prisma
- Mantener consistencia entre Supabase Auth y tu BD

### 3. Manejo de Roles y Permisos
- Supabase Auth no maneja roles automáticamente
- Continuar guardando roles en tu tabla User
- El SupabaseAuthGuard ya extrae el user y lo agrega a request

### 4. Refresh Tokens
- Supabase maneja refresh tokens automáticamente
- Retornar tanto access_token como refresh_token
- Cliente debe manejar el refresh cuando expire

## Próximos Pasos

1. ✅ Eliminar `hashedPassword` del schema de Prisma
2. ✅ Actualizar todos los handlers para usar Supabase Auth
3. ✅ Actualizar DTOs si es necesario
4. ✅ Ejecutar migración de Prisma
5. ✅ Probar cada endpoint de autenticación
6. ✅ Actualizar tests

## Migración de Usuarios Existentes (si aplica)

Si tienes usuarios existentes con bcrypt hashes:

```typescript
// Script de migración
for (const user of existingUsers) {
  // 1. Crear en Supabase Auth
  const { data } = await supabase.auth.admin.createUser({
    email: user.email,
    password: generateTemporaryPassword(), // O enviar email de reset
    email_confirm: true
  });
  
  // 2. Actualizar ID en tu BD
  await prisma.user.update({
    where: { id: user.id },
    data: { id: data.user.id } // Actualizar con ID de Supabase
  });
}

// Enviar emails para que usuarios establezcan nueva contraseña
```
