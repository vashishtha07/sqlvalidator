from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlfluff.core import Linter
import re

app = Flask(__name__)
CORS(app)

# Global variable to store selected DB type
SELECTED_DB_TYPE = "mysql"  # default
# git init
# git add README.md
# git commit -m "first commit"
# git branch -M main
# git remote add origin https://github.com/vashishtha07/sqlvalidator.git
# git push -u origin main
@app.route('/validate', methods=['POST'])
def validate():
    try:
        data = request.get_json()
        sql = data.get('sql', '')
        dialect = data.get('dialect', SELECTED_DB_TYPE.lower())
        # Always use the DB type selected in terminal
        db_type = SELECTED_DB_TYPE

        if not sql.strip():
            return jsonify({"valid": False, "errors": ["No SQL provided"]}), 400

        # Allowed functions per DB
        ALLOWED_FUNCTIONS_MAP = {
            "mysql": ["NOW", "CURDATE", "DATE_ADD", "IFNULL", "CONCAT"],
            "postgres": ["NOW", "AGE", "TO_CHAR", "DATE_TRUNC"],
            "oracle": ["SYSDATE", "NVL", "TO_DATE", "ADD_MONTHS"],
            "ansi": ["CURRENT_TIMESTAMP", "CURRENT_DATE"]
        }
        allowed_functions = ALLOWED_FUNCTIONS_MAP.get(db_type.lower(), ALLOWED_FUNCTIONS_MAP["mysql"])

        # Linter uses the selected DB dialect
        linter = Linter(
            dialect=db_type.lower() if db_type.lower() in ["mysql", "postgres", "ansi"] else "mysql",
            exclude_rules=["all"]
        )

        lint_result = linter.lint_string(sql)

        # Debug: print violations
        for v in lint_result.violations:
            print(f"Rule: {v.rule_code()} | Line: {v.line_no} | Pos: {v.line_pos} | Message: {v.desc()}")

        # Regex to find function calls
        function_pattern = re.compile(r"([a-zA-Z_][a-zA-Z0-9_]*)\s*\(")
        custom_func_errors = []
        for match in function_pattern.finditer(sql):
            func_name = match.group(1).upper()
            if func_name not in allowed_functions:
                custom_func_errors.append({
                    "line": sql[:match.start()].count('\n') + 1,
                    "pos": match.start() - sql.rfind('\n', 0, match.start()),
                    "message": f"Function '{func_name}' is not allowed for {db_type.upper()}."
                })

        # Ignore placeholder errors
        placeholder_pattern = re.compile(r"[%$][a-zA-Z0-9_]+")
        violations = [v for v in lint_result.violations if not placeholder_pattern.search(v.desc())]

        errors = []

        if not violations:
            # If there are custom function errors, treat as invalid
            if custom_func_errors:
                return jsonify({"valid": False, "errors": custom_func_errors})
            return jsonify({"valid": True, "errors": []})

        # Handle sqlfluff violations
        for v in violations:
            msg = v.desc()
            user_msg = None
            if "unparsable section" in msg:
                match = re.search(r"unparsable section: '([^']+)'", msg)
                section = match.group(1) if match else ''
                user_msg = f"Your SQL could not be understood. Please check the syntax near '{section}'."
            elif "syntax error" in msg.lower():
                user_msg = "There is a syntax error in your SQL. Please review your query."
            if user_msg:
                errors.append({"line": v.line_no, "pos": v.line_pos, "message": user_msg})
            else:
                errors.append({"line": v.line_no, "pos": v.line_pos, "message": msg})

        return jsonify({"valid": False, "errors": errors})

    except Exception as e:
        print(f"Server error: {e}")
        return jsonify({"valid": False, "errors": [str(e)]}), 500


if __name__ == '__main__':
    # Ask for DB type ONCE when starting the server
    # selected = input("Enter DB type (mysql/postgres/oracle) [default=mysql]: ").strip().lower()
    
    # if selected in ["mysql", "postgres", "oracle", "ansi"]:
    #     SELECTED_DB_TYPE = selected
    # else:
    #     SELECTED_DB_TYPE = "mysql"  # fallback

    print(f"✅ Using DB type: {SELECTED_DB_TYPE.upper()}")
    app.run(debug=True, port=5000)
