## Usuarios
admin@cabanitas.com
admin123


encargado@cabanitas.com
encargado123


cliente@example.com
cliente123


trabajador1@cabanitas.com
trabajadro123


trabajador2@cabanitas.com
trabajador123


carlos2@test.cl
carlos123


test@test.cl
test

## Comandos principales

### Resetear datos

npm run reset

### Configuración inicial

npm install
npm run migrate
npm run seed
npm start

### Ver datos en MySQL

mysql -u root -p
USE cabanitas_dev;
SELECT * FROM users;
SELECT * FROM reservas;
EXIT;



## Configurar el archivo .env
Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=cabanitas_dev
SESSION_SECRET=tu_secret_key_muy_segura_aqui_cambiala
PORT=3




