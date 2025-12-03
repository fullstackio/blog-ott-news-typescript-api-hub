import mongoose, { Connection } from "mongoose";

const tenantConnections: Record<string, Connection> = {};

export function getTenantDbConnection(tenantId: string): Connection {
  const dbName = `sys_tenant_${tenantId}`;
  const connectionUri = `mongodb://localhost:27017/${dbName}`;

  if (tenantConnections[tenantId]) {
    return tenantConnections[tenantId];
  }

  const conn = mongoose.createConnection(connectionUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as any);

  tenantConnections[tenantId] = conn;
  return conn;
}

export function getTenantDbName(tenantId: string): string {
  return `sys_tenant_${tenantId}`;
}

export function getTenantConnectionUri(tenantId: string): string {
  return `mongodb://localhost:27017/sys_tenant_${tenantId}`;
}
