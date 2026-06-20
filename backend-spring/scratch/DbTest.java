package scratch;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DbTest {
    public static void main(String[] args) {
        String[] passwords = {"postgres", "", "admin", "root"};
        String[] urls = {
            "jdbc:postgresql://localhost:5432/postgres",
            "jdbc:postgresql://localhost:5432/interviewforge"
        };
        
        System.out.println("Starting Database Connection Diagnostics...");
        
        // Load driver
        try {
            Class.forName("org.postgresql.Driver");
        } catch (Exception e) {
            System.err.println("Failed to load PostgreSQL Driver: " + e.getMessage());
            return;
        }
        
        boolean success = false;
        for (String url : urls) {
            for (String password : passwords) {
                System.out.printf("Trying connection to %s with password '%s'... ", url, password);
                try (Connection conn = DriverManager.getConnection(url, "postgres", password)) {
                    System.out.println("SUCCESS!");
                    
                    // If we successfully connected to 'postgres' database, let's try to create 'interviewforge' database!
                    if (url.endsWith("/postgres")) {
                        System.out.println("Attempting to create 'interviewforge' database if it doesn't exist...");
                        try (Statement stmt = conn.createStatement()) {
                            stmt.execute("CREATE DATABASE interviewforge");
                            System.out.println("Database 'interviewforge' created successfully!");
                        } catch (Exception dbEx) {
                            if (dbEx.getMessage().contains("already exists")) {
                                System.out.println("Database 'interviewforge' already exists.");
                            } else {
                                System.err.println("Failed to create database: " + dbEx.getMessage());
                            }
                        }
                    }
                    success = true;
                } catch (Exception e) {
                    System.out.println("FAILED: " + e.getMessage().trim());
                }
            }
        }
        
        if (!success) {
            System.out.println("All default database connections failed. Please check local postgres configuration.");
        }
    }
}
