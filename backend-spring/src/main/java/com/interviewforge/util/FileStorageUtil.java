package com.interviewforge.util;

import com.interviewforge.exception.StorageException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Component
public class FileStorageUtil {

    private final Path fileStorageLocation;

    public FileStorageUtil(@Value("${app.upload.dir:uploads/resumes}") String uploadDir) {
        Path location = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(location);
        } catch (Exception ex) {
            location = Paths.get(System.getProperty("java.io.tmpdir"), "uploads", "resumes").toAbsolutePath().normalize();
            try {
                Files.createDirectories(location);
            } catch (Exception e) {
                throw new StorageException("Could not create the directory where uploaded files will be stored.", e);
            }
        }
        this.fileStorageLocation = location;
    }

    public String storeFile(MultipartFile file) {
        String contentType = file.getContentType();
        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        
        String lowerName = originalFileName.toLowerCase();
        boolean isValidExtension = lowerName.endsWith(".pdf") || lowerName.endsWith(".docx") || lowerName.endsWith(".doc") || lowerName.endsWith(".txt");
        
        if (!isValidExtension) {
            throw new StorageException("Only PDF, DOCX, DOC, and TXT resumes are supported.");
        }

        try {
            if (file.isEmpty()) {
                throw new StorageException("Failed to store empty file " + originalFileName);
            }
            if (originalFileName.contains("..")) {
                // Security check to prevent directory traversal
                throw new StorageException("Cannot store file with relative path outside current directory " + originalFileName);
            }

            // Generate a unique file name to avoid collisions
            String fileExtension = "";
            int extensionIndex = originalFileName.lastIndexOf(".");
            if (extensionIndex > 0) {
                fileExtension = originalFileName.substring(extensionIndex);
            }
            String targetFileName = UUID.randomUUID().toString() + fileExtension;

            // Copy file to the target location
            Path targetLocation = this.fileStorageLocation.resolve(targetFileName);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            }

            return targetFileName;
        } catch (IOException ex) {
            throw new StorageException("Could not store file " + originalFileName + ". Please try again!", ex);
        }
    }

    public void deleteFile(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }
        } catch (IOException ex) {
            throw new StorageException("Could not delete file " + fileName, ex);
        }
    }
}
