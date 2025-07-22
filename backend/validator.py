from sqlfluff.core import Linter

def validate_sql(sql_code, dialect="ansi"):
    # Create a linter object with the specified dialect (default ANSI)
    linter = Linter(dialect=dialect)

    # Lint the SQL string (check syntax)
    result = linter.lint_string(sql_code)

    # Get violations (syntax errors or style errors)
    violations = result.violations

    # If no violations, it's valid
    if not violations:
        return {"valid": True, "errors": []}
    
    # Otherwise, collect error details
    errors = []
    for v in violations:
        errors.append({
            "line": v.line_no,
            "pos": v.line_pos,
            "message": v.desc
        })

    return {"valid": False, "errors": errors}
