-- Run this script in your Azure SQL Database.
IF OBJECT_ID(N'dbo.Tasks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tasks
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Tasks PRIMARY KEY,
        Title NVARCHAR(200) NOT NULL,
        Description NVARCHAR(1000) NULL,
        IsCompleted BIT NOT NULL CONSTRAINT DF_Tasks_IsCompleted DEFAULT (0),
        CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Tasks_CreatedAt DEFAULT (SYSUTCDATETIME())
    );
END;
GO

-- Optional sample records (only inserted when the table is empty).
IF NOT EXISTS (SELECT 1 FROM dbo.Tasks)
BEGIN
    INSERT INTO dbo.Tasks (Title, Description)
    VALUES
      (N'Explore Azure App Service', N'Deploy the Node.js REST API'),
      (N'Connect Azure SQL', N'Configure the backend database connection'),
      (N'Publish React frontend', N'Build and host the Vite application');
END;
GO

SELECT Id, Title, Description, IsCompleted, CreatedAt
FROM dbo.Tasks
ORDER BY CreatedAt DESC;
GO
