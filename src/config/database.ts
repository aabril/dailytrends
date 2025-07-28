// aqui la conexión con MongoDB, usando mongoose o cualquier otro odm que vaya a usar
// las conexión a bases de datos normalmente deberían ser Singleton para reutilizar la conexión
// motivo: pues no saturar la base de datos ni saturarla con multiples conexiones

export class DatabaseConnection {
    private static instance: DatabaseConnection;
    // private isConnected: boolean = false; // a implementar
  
    private constructor() {}
  
    public static getInstance(): DatabaseConnection {
      if (!DatabaseConnection.instance) {
        DatabaseConnection.instance = new DatabaseConnection();
      }
      return DatabaseConnection.instance;
    }
}
