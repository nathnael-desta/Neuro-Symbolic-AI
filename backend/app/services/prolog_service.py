# backend/app/services/prolog_service.py

from pyswip import Prolog, Atom, Functor, Variable

class PrologService:
    """
    A service to encapsulate all interactions with the SWI-Prolog engine.
    """
    def __init__(self, knowledge_base_path: str, rules_path: str):
        self.prolog = Prolog()
        # Load the knowledge base and rules
        self.prolog.consult(knowledge_base_path)
        self.prolog.consult(rules_path)
        print("Prolog knowledge base and rules loaded successfully.")

    def _deserialize_result(self, result):
        """
        Recursively converts pyswip types (Atom, Variable, etc.) to standard Python types.
        This is a critical step to make the query results usable by the rest of the app.
        """
        if isinstance(result, list):
            return [self._deserialize_result(item) for item in result]
        if isinstance(result, Atom):
            # Atom values are bytes, so they need to be decoded
            return result.value.decode('utf-8')
        if isinstance(result, Functor):
            # Functors can be complex; for now, we'll stringify them
            return str(result)
        # Add other type conversions as needed (e.g., for Variable)
        return result

    def run_query(self, query_string: str) -> list:
        """Executes a query and returns a list of deserialized solution dictionaries."""
        try:
            print(f"Executing Prolog query: {query_string}")
            solutions = list(self.prolog.query(query_string))
            
            if not solutions and query_string.endswith("."):
                # pyswip can sometimes fail on queries with a trailing period if there are no results
                solutions = list(self.prolog.query(query_string[:-1]))
            
            deserialized_solutions = []
            for sol in solutions:
                deserialized_sol = {}
                for var, val in sol.items():
                    deserialized_sol[var] = self._deserialize_result(val)
                deserialized_solutions.append(deserialized_sol)
            
            print(f"Query returned {len(deserialized_solutions)} solution(s).")
            return deserialized_solutions
        except Exception as e:
            # Proper logging should be added here
            print(f"Prolog query failed: {e}")
            return []

# --- Singleton Instance ---
# This creates a single, shared instance of the service for the entire application.
# IMPORTANT: Adjust the paths to be correct relative to your project's root directory.
prolog_service = PrologService(
   knowledge_base_path="../../../data_processing/associations.pl",
   rules_path="../../../data_processing/rules.pl"
)