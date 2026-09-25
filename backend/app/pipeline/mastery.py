from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class BloomQuestion(BaseModel):
    id: str
    bloom_level: str  # Remember, Understand, Apply, Analyze, Evaluate, Create
    prompt: str
    latex_equation: Optional[str] = None
    options: List[str]
    correct_option_index: int
    explanation: str


class TopicNode(BaseModel):
    id: str
    title: str
    category: str
    prerequisites: List[str]
    bloom_level: str
    mastery_percentage: int
    is_unlocked: bool
    summary: str
    key_formula: str
    questions: List[BloomQuestion] = Field(default_factory=list)


class CurriculumDAG:
    """
    Manages dependency graph and Bloom's cognitive taxonomy tracking across STEM curricula.
    """

    def __init__(self):
        self.nodes: Dict[str, TopicNode] = {
            "calc_deriv": TopicNode(
                id="calc_deriv",
                title="Single-Variable Differentiation",
                category="Calculus",
                prerequisites=[],
                bloom_level="Remember",
                mastery_percentage=95,
                is_unlocked=True,
                summary="Rate of change, power rule, product rule, and chain rule.",
                key_formula=r"f'(x) = \lim_{\Delta x \to 0} \frac{f(x+\Delta x) - f(x)}{\Delta x}",
                questions=[
                    BloomQuestion(
                        id="q1",
                        bloom_level="Remember",
                        prompt="What is the derivative of e^{3x} with respect to x?",
                        latex_equation=r"\frac{d}{dx}[e^{3x}]",
                        options=["3e^{3x}", "e^{3x}", "\\frac{1}{3}e^{3x}", "3xe^{3x}"],
                        correct_option_index=0,
                        explanation="By the chain rule, d/dx[e^{u}] = e^{u} * u', so 3e^{3x}."
                    )
                ]
            ),
            "lin_alg_vec": TopicNode(
                id="lin_alg_vec",
                title="Vectors and Inner Products",
                category="Linear Algebra",
                prerequisites=[],
                bloom_level="Remember",
                mastery_percentage=90,
                is_unlocked=True,
                summary="Euclidean spaces, dot products, vector orthogonality, and projections.",
                key_formula=r"\mathbf{u} \cdot \mathbf{v} = \|\mathbf{u}\|\|\mathbf{v}\|\cos\theta",
                questions=[
                    BloomQuestion(
                        id="q2",
                        bloom_level="Understand",
                        prompt="If two non-zero vectors have an inner product equal to 0, what does this geometrically imply?",
                        options=["They are orthogonal (perpendicular)", "They are parallel", "They have equal length", "They form a linear basis"],
                        correct_option_index=0,
                        explanation="cos(theta) = 0 implies theta = 90 degrees, i.e., orthogonality."
                    )
                ]
            ),
            "multivar_grad": TopicNode(
                id="multivar_grad",
                title="Multivariable Gradients & Directional Derivatives",
                category="Calculus",
                prerequisites=["calc_deriv"],
                bloom_level="Understand",
                mastery_percentage=85,
                is_unlocked=True,
                summary="Partial derivatives, Jacobian vectors, and gradient vector fields.",
                key_formula=r"\nabla f = \left[ \frac{\partial f}{\partial x_1}, \dots, \frac{\partial f}{\partial x_n} \right]^T",
                questions=[
                    BloomQuestion(
                        id="q3",
                        bloom_level="Apply",
                        prompt="In which direction does the gradient vector point?",
                        options=["Direction of steepest ascent", "Direction of steepest descent", "Perpendicular to the surface normal", "Along contour level curves"],
                        correct_option_index=0,
                        explanation="The gradient vector points in the direction of maximal positive rate of change."
                    )
                ]
            ),
            "grad_descent": TopicNode(
                id="grad_descent",
                title="Gradient Descent & Loss Optimization",
                category="Optimization",
                prerequisites=["multivar_grad", "lin_alg_vec"],
                bloom_level="Apply",
                mastery_percentage=78,
                is_unlocked=True,
                summary="Iterative parameter updates, step size learning rates, and convex landscapes.",
                key_formula=r"\mathbf{\theta}_{t+1} = \mathbf{\theta}_t - \alpha \nabla_{\mathbf{\theta}} \mathcal{L}(\mathbf{\theta})",
                questions=[
                    BloomQuestion(
                        id="q4",
                        bloom_level="Analyze",
                        prompt="What happens if the learning rate alpha is set too high in non-convex optimization?",
                        options=["Oscillations and explosive divergence", "Convergence to global minimum is accelerated", "Hessian eigenvalues invert", "Gradients vanish to zero"],
                        correct_option_index=0,
                        explanation="Overstepping the valley causes oscillation across the canyon walls and numerical divergence."
                    )
                ]
            ),
            "fourier_series": TopicNode(
                id="fourier_series",
                title="Fourier Transform & Orthogonal Bases",
                category="Signal Analysis",
                prerequisites=["calc_deriv", "lin_alg_vec"],
                bloom_level="Analyze",
                mastery_percentage=72,
                is_unlocked=True,
                summary="Decomposing arbitrary signals into rotating complex sinusoids.",
                key_formula=r"\hat{f}(\xi) = \int_{-\infty}^{\infty} f(x) e^{-2\pi i x \xi} dx",
                questions=[
                    BloomQuestion(
                        id="q5",
                        bloom_level="Analyze",
                        prompt="Why is the continuous Fourier transform considered a continuous inner product with complex exponentials?",
                        options=["Because e^{-2pi i x xi} forms an orthogonal continuous basis over L2", "Because Euler's formula only works for integer harmonics", "Because the Fourier kernel is always real-valued", "Because it minimizes the second derivative"],
                        correct_option_index=0,
                        explanation="Complex exponentials form an orthogonal basis in Hilbert space L^2(R)."
                    )
                ]
            ),
            "quantum_bloch": TopicNode(
                id="quantum_bloch",
                title="Quantum Superposition & Bloch Sphere",
                category="Quantum Physics",
                prerequisites=["lin_alg_vec"],
                bloom_level="Evaluate",
                mastery_percentage=60,
                is_unlocked=True,
                summary="Single-qubit state space, unitary rotations, and quantum phase evolution.",
                key_formula=r"|\psi\rangle = \cos\frac{\theta}{2} |0\rangle + e^{i\phi}\sin\frac{\theta}{2} |1\rangle",
                questions=[
                    BloomQuestion(
                        id="q6",
                        bloom_level="Evaluate",
                        prompt="What is the probability of measuring state |0> given a qubit at the equator with theta = pi/2?",
                        options=["0.5 (50%)", "1.0 (100%)", "0.0 (0%)", "0.25 (25%)"],
                        correct_option_index=0,
                        explanation="P(|0>) = |cos(pi/4)|^2 = (1/sqrt(2))^2 = 0.5."
                    )
                ]
            ),
            "backprop_neural": TopicNode(
                id="backprop_neural",
                title="Reverse-Mode Autodiff & Backpropagation",
                category="Machine Learning",
                prerequisites=["grad_descent"],
                bloom_level="Create",
                mastery_percentage=45,
                is_unlocked=True,
                summary="Computational DAG traversal, adjoint sensitivities, and chain rule caching.",
                key_formula=r"\frac{\partial \mathcal{L}}{\partial w_{ij}} = \delta_j \cdot a_i",
                questions=[
                    BloomQuestion(
                        id="q7",
                        bloom_level="Create",
                        prompt="Why does reverse-mode automatic differentiation have O(1) complexity relative to the number of input parameters for scalar loss?",
                        options=["Because intermediate adjoint sensitivities are cached during forward pass and propagated once backwards", "Because the Jacobian matrix is diagonal", "Because neural networks are always strictly linear", "Because gradients cancel out due to symmetry"],
                        correct_option_index=0,
                        explanation="Forward pass caches activations; backward pass traverses backwards once from scalar loss."
                    )
                ]
            )
        }

    def get_all_nodes(self) -> List[TopicNode]:
        return list(self.nodes.values())

    def update_node_mastery(self, node_id: str, new_score: int) -> TopicNode:
        if node_id in self.nodes:
            node = self.nodes[node_id]
            node.mastery_percentage = max(0, min(100, new_score))

            # Check if dependent nodes can now be unlocked
            for other_node in self.nodes.values():
                if node_id in other_node.prerequisites:
                    all_prereqs_met = all(
                        self.nodes[p].mastery_percentage >= 70
                        for p in other_node.prerequisites
                        if p in self.nodes
                    )
                    if all_prereqs_met:
                        other_node.is_unlocked = True

            return node
        raise ValueError(f"Node {node_id} not found")


curriculum_dag = CurriculumDAG()
