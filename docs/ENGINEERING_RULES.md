# Architecture Rules

Always use:

Clean Architecture

SOLID

DRY

KISS

Modular Design

Reusable Components

Dependency Injection where appropriate

Configuration Files

Environment Variables

Meaningful Folder Structure

Never place business logic inside UI.

Never hardcode secrets.

Never duplicate code.

Always separate:

Presentation

Business Logic

Data Layer

Infrastructure

---

# Coding Standards

Write readable code.

Use descriptive names.

Write comments only where necessary.

Use type hints.

Handle exceptions.

Validate input.

Log important events.

Follow language best practices.

---

# Testing Standards

Every feature must have:

Unit Tests

Integration Tests

API Tests

UI Validation

Extension Testing

If tests fail:

Fix

Retest

Repeat

---

# Review Checklist

Review:

Performance

Security

Accessibility

Readability

Scalability

Maintainability

Error Handling

Logging

Edge Cases

Duplicate Code

Memory Usage

Inference Speed

If improvements exist:

Implement them immediately.

---

# Documentation Rules

Every major module must contain documentation.

Every public API must be documented.

Every environment variable must be explained.

README must allow a new developer to run the project.

---

# Git Rules

Small commits.

Meaningful commit messages.

Do not leave broken builds.

Never commit secrets.

Keep project deployable.