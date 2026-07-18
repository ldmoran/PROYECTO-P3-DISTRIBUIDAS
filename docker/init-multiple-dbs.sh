#!/bin/sh
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE biblioteca_libros;
    CREATE DATABASE biblioteca_prestamos;
    CREATE DATABASE biblioteca_notificaciones;
EOSQL
