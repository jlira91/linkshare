# Cómo publicar la app "Para Ti" 💌

Sigue estos pasos en orden. Cada uno toma 5-10 minutos.
No necesitas saber programar — solo seguir los pasos.

---

## PASO 1 — Instalar Node.js (una sola vez)

1. Ve a: https://nodejs.org
2. Descarga el botón verde que dice **"LTS"**
3. Abre el instalador y da clic en "Next" hasta terminar
4. Reinicia tu computadora

---

## PASO 2 — Crear cuenta en GitHub (una sola vez)

1. Ve a: https://github.com
2. Crea una cuenta gratuita (necesitas un email)
3. Verifica tu email

---

## PASO 3 — Subir el código a GitHub

1. Abre la carpeta `linkshare` en tu computadora
2. Abre una terminal (PowerShell) en esa carpeta:
   - Mantén Shift y haz clic derecho dentro de la carpeta
   - Selecciona "Abrir ventana de PowerShell aquí"
3. Escribe estos comandos uno por uno (Enter después de cada uno):

```
git init
git add .
git commit -m "primer commit"
```

4. Ve a GitHub.com → clic en el "+" (arriba a la derecha) → "New repository"
5. Nombre: `linkshare` → deja todo lo demás por defecto → clic **Create repository**
6. GitHub te mostrará unos comandos. Copia y pega los que empiezan con `git remote add origin...` y `git push`

---

## PASO 4 — Crear base de datos en Supabase (GRATIS)

1. Ve a: https://supabase.com → clic en **Start your project** → crea cuenta gratuita
2. Clic en **New project**
   - Ponle cualquier nombre (ej: "linkshare")
   - Elige una contraseña para la base de datos (guárdala)
   - Selecciona la región más cercana a ti
3. Espera ~2 minutos a que el proyecto se cree
4. Cuando esté listo, ve al menú izquierdo → **SQL Editor**
5. Copia y pega esto en el editor y luego presiona **Run**:

```sql
create table public.links (
  id uuid default gen_random_uuid() primary key,
  url text not null,
  title text not null,
  description text default '',
  category text not null default 'Otros',
  is_read boolean default false,
  created_at timestamptz default now(),
  read_at timestamptz,
  image_url text default ''
);

alter table public.links enable row level security;
create policy "Allow all" on public.links for all using (true);
```

6. Ahora ve a **Settings** (engrane en menú izquierdo) → **API**
7. Copia estos dos valores (los necesitas en el Paso 5):
   - **Project URL** (empieza con `https://`)
   - **service_role** key (en la sección "Project API keys" → clic en "Reveal")

---

## PASO 5 — Publicar en Vercel (GRATIS)

1. Ve a: https://vercel.com → crea cuenta con tu cuenta de GitHub
2. Clic en **Add New Project** → importa el repositorio `linkshare`
3. Antes de hacer clic en Deploy, busca la sección **Environment Variables** y agrega estas 6 variables:

| Nombre | Valor |
|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | La URL de Supabase del Paso 4 |
| `SUPABASE_SERVICE_ROLE_KEY` | La service_role key del Paso 4 |
| `HUSBAND_NAME` | Tu nombre (ej: Jorge) |
| `HUSBAND_PASSWORD` | Tu contraseña (invéntala) |
| `WIFE_NAME` | El nombre de ella (ej: Mi Amor) |
| `WIFE_PASSWORD` | La contraseña de ella (invéntala) |
| `SESSION_SECRET` | Cualquier texto largo de 32+ caracteres (ej: `mi_app_secreta_para_mi_amor_2024_linkshare`) |

4. Clic en **Deploy** → espera ~2 minutos
5. Vercel te da una URL del tipo `linkshare-xxx.vercel.app`

---

## PASO 6 — Usar la app en el iPhone

1. En Safari del iPhone, abre la URL de Vercel
2. Clic en el ícono compartir (cuadro con flechita) → **Añadir a pantalla de inicio**
3. ¡Ya tienes el ícono de la app en tu pantalla!
4. Comparte la misma URL con tu esposa para que ella haga lo mismo

---

## Cómo funciona la app

- **Tú** entras con "Soy yo 👨" y tu contraseña
- **Ella** entra con "Soy yo 👩" y la contraseña de ella
- Solo tú puedes agregar links (botón "+" en rojo)
- Los dos pueden marcar como leído/visto y borrar links
- El punto rojo = no visto todavía
- Cuando ella abre un link, se marca como leído automáticamente

---

## Si algo no funciona

Escríbeme y te ayudo a resolver cualquier paso.
