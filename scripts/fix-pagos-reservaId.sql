-- Script para verificar y corregir la columna reservaId en la tabla pagos
-- Ejecutar este script en MySQL si el problema persiste

-- Verificar estructura actual
DESCRIBE pagos;

-- Modificar columna para permitir NULL y establecer DEFAULT NULL
ALTER TABLE pagos
MODIFY COLUMN reservaId INT NULL DEFAULT NULL;

-- Verificar que el cambio se aplicó
DESCRIBE pagos;

