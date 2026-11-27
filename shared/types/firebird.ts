export interface FirebirdConnectionConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
  role?: string
  charset?: string
}

export type FirebirdScalarValue = string | number | bigint | boolean | Date | Uint8Array | null

export type FirebirdValue = FirebirdScalarValue | readonly FirebirdValue[]
export type FirebirdParameter = FirebirdValue
export type FirebirdRow = Record<string, FirebirdValue>

export type FirebirdColumnType =
  | 'ARRAY'
  | 'BIGINT'
  | 'BLOB'
  | 'BOOLEAN'
  | 'CHAR'
  | 'DATE'
  | 'DECIMAL'
  | 'DECFLOAT'
  | 'DOUBLE PRECISION'
  | 'FLOAT'
  | 'INT128'
  | 'INTEGER'
  | 'NUMERIC'
  | 'REAL'
  | 'SMALLINT'
  | 'TIME'
  | 'TIME WITH TIME ZONE'
  | 'TIMESTAMP'
  | 'TIMESTAMP WITH TIME ZONE'
  | 'VARCHAR'

export interface FirebirdColumnMetadata {
  name: string
  type: FirebirdColumnType
  nullable: boolean
  position: number
  length?: number
  precision?: number
  scale?: number
  subtype?: number
  characterSet?: string
  collation?: string
  defaultValue?: string
}

export interface FirebirdIndexMetadata {
  name: string
  columns: readonly string[]
  unique: boolean
  descending: boolean
  active: boolean
}

export interface FirebirdForeignKeyMetadata {
  name: string
  columns: readonly string[]
  referencedTable: string
  referencedColumns: readonly string[]
  updateRule?: string
  deleteRule?: string
}

export interface FirebirdTableMetadata {
  name: string
  columns: readonly FirebirdColumnMetadata[]
  primaryKey: readonly string[]
  indexes: readonly FirebirdIndexMetadata[]
  foreignKeys: readonly FirebirdForeignKeyMetadata[]
}

export interface FirebirdProcedureParameterMetadata {
  name: string
  type: FirebirdColumnType
  position: number
  direction: 'input' | 'output'
  nullable: boolean
  length?: number
  precision?: number
  scale?: number
}

export interface FirebirdProcedureMetadata {
  name: string
  inputParameters: readonly FirebirdProcedureParameterMetadata[]
  outputParameters: readonly FirebirdProcedureParameterMetadata[]
}

export interface FirebirdQueryResult<Row = FirebirdRow> {
  rows: readonly Row[]
  rowCount: number
  affectedRows?: number
}

export type FirebirdTransactionIsolation = 'read-committed' | 'snapshot' | 'serializable'

export interface FirebirdTransactionOptions {
  isolation?: FirebirdTransactionIsolation
  readOnly?: boolean
  wait?: boolean
}

export interface FirebirdExecutor {
  query<Row = FirebirdRow>(
    statement: string,
    parameters?: readonly FirebirdParameter[],
  ): Promise<FirebirdQueryResult<Row>>
}

export interface FirebirdTransaction extends FirebirdExecutor {
  commit(): Promise<void>
  rollback(): Promise<void>
}

export interface FirebirdClient extends FirebirdExecutor {
  transaction<Result>(
    callback: (transaction: FirebirdTransaction) => Promise<Result>,
    options?: FirebirdTransactionOptions,
  ): Promise<Result>
  disconnect(): Promise<void>
}

export interface FirebirdError extends Error {
  code?: string | number
  sqlCode?: number
  sqlState?: string
  gdsCodes?: readonly string[]
}
