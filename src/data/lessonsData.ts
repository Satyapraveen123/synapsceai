import { LessonData } from '../types';

export const SAMPLE_LESSONS: LessonData[] = [
  {
    id: 'fourier-transform',
    title: 'The Continuous Fourier Transform & Spectral Decomposition',
    category: 'Harmonic Analysis & Signal Processing',
    bloomLevel: 'Analyze',
    duration: 32,
    description: 'Decomposing arbitrary continuous waveforms into an orthogonal basis of complex rotating exponentials, transforming temporal signals into pure spectral frequencies.',
    primaryEquation: '\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x) e^{-2\\pi i x \\xi} \\, dx',
    interactiveType: 'fourier',
    tags: ['Harmonics', 'Orthogonal Basis', 'Euler Identity', 'Signal Decomposition'],
    manimPythonCode: `from manim import *
import numpy as np

class FourierTransformScene(Scene):
    def construct(self):
        # 1. Title and Governing Formula
        title = Title(r"\\text{The Continuous Fourier Transform}", color=BLUE_B)
        formula = MathTex(
            r"\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x) e^{-2\\pi i x \\xi} \\, dx",
            color=YELLOW
        ).scale(0.95).next_to(title, DOWN)
        
        self.play(Write(title), run_time=1.5)
        self.play(FadeIn(formula, shift=UP), run_time=1.2)
        self.wait(1.5)

        # 2. Time-Domain Signal Coordinate Plane
        axes = Axes(
            x_range=[-3, 3, 1],
            y_range=[-1.5, 1.5, 0.5],
            x_length=7,
            y_length=3,
            axis_config={"color": GREY_A}
        ).shift(DOWN * 1.2)
        
        time_label = axes.get_x_axis_label(r"t \\text{ (time)}")
        self.play(Create(axes), Write(time_label))

        # Composite multi-tone waveform
        signal = axes.plot(
            lambda t: 0.7 * np.sin(2 * np.pi * 1.0 * t) + 0.35 * np.cos(2 * np.pi * 3.0 * t),
            color=TEAL
        )
        sig_label = MathTex(r"f(t) = \\sin(2\\pi t) + 0.5\\cos(6\\pi t)", color=TEAL).scale(0.7).next_to(axes, UP)
        
        self.play(Create(signal), Write(sig_label), run_time=2.0)
        self.wait(2)

        # 3. Wrapping the Signal on Complex Plane (Epicycles)
        euler_exp = MathTex(
            r"e^{-2\\pi i t \\xi} = \\cos(2\\pi t \\xi) - i\\sin(2\\pi t \\xi)",
            color=GOLD
        ).scale(0.85).to_corner(UL).shift(DOWN * 0.5)
        self.play(Transform(formula, euler_exp))
        
        # Center of mass pointer
        com_dot = Dot(color=RED, radius=0.12).move_to(axes.c2p(0, 0))
        com_label = Text("Center of Mass Spike", font_size=20, color=RED).next_to(com_dot, UR)
        self.play(FadeIn(com_dot), Write(com_label))
        self.wait(2)
        
        self.play(FadeOut(axes), FadeOut(signal), FadeOut(sig_label), FadeOut(com_dot), FadeOut(com_label))
`,
    steps: [
      {
        id: 'ft_step_1',
        stepNumber: 1,
        label: 'Continuous Signal Space',
        latex: 'f(t) \\in L^2(\\mathbb{R})',
        explanation: 'Any finite-energy signal belongs to the Hilbert space of square-integrable functions over the real line.',
        sympyRule: 'Hilbert Space Metric Definition',
        timestampStart: 0,
      },
      {
        id: 'ft_step_2',
        stepNumber: 2,
        label: 'Euler Complex Basis Function',
        latex: 'e^{-2\\pi i t \\xi} = \\cos(2\\pi t \\xi) - i\\sin(2\\pi t \\xi)',
        explanation: 'The kernel decomposes into orthogonal quadrature oscillations, providing a continuous basis over frequency ξ.',
        sympyRule: 'Euler Identity Expansion',
        timestampStart: 7,
      },
      {
        id: 'ft_step_3',
        stepNumber: 3,
        label: 'Inner Product Projection',
        latex: '\\langle f, e^{2\\pi i t \\xi} \\rangle = \\int_{-\\infty}^{\\infty} f(t) e^{-2\\pi i t \\xi} \\, dt',
        explanation: 'The Fourier integral represents the continuous inner product of the signal against rotating unit phasors.',
        sympyRule: 'Inner Product Functional Calculus',
        timestampStart: 15,
      },
      {
        id: 'ft_step_4',
        stepNumber: 4,
        label: 'Inverse Synthesis Reconstruction',
        latex: 'f(t) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi) e^{2\\pi i t \\xi} \\, d\\xi',
        explanation: 'Plancherel’s theorem guarantees exact reconstruction of the original signal by continuous spectral synthesis.',
        sympyRule: 'Fourier Inversion Theorem',
        timestampStart: 23,
      },
    ],
    cues: [
      {
        id: 'cue_01',
        timestamp: 0,
        endTimestamp: 7,
        text: 'Welcome to SynapseAI. In this lesson, we explore how the Fourier transform decomposes any complex wave into pure rotating frequencies.',
        activeLatexId: 'ft_step_1',
        action: 'Write(title)'
      },
      {
        id: 'cue_02',
        timestamp: 7,
        endTimestamp: 15,
        text: 'Notice Euler’s identity: multiplying by e to the power minus 2 pi i t xi wraps our signal around the complex unit plane like an epicycle.',
        activeLatexId: 'ft_step_2',
        action: 'Transform(formula, euler_exp)'
      },
      {
        id: 'cue_03',
        timestamp: 15,
        endTimestamp: 23,
        text: 'When the wrapping frequency matches an intrinsic harmonic of the signal, the center of mass moves away from the origin, creating a distinct spectral peak.',
        activeLatexId: 'ft_step_3',
        action: 'FadeIn(com_dot)'
      },
      {
        id: 'cue_04',
        timestamp: 23,
        endTimestamp: 32,
        text: 'By integrating over all frequencies, Plancherel and Fourier inversion prove that no information is lost in the spectral domain.',
        activeLatexId: 'ft_step_4',
        action: 'Create(spectrum_spikes)'
      }
    ],
    citations: [
      {
        id: 'cit_01',
        bookTitle: 'Fourier Analysis: An Introduction (Princeton Lectures in Analysis)',
        section: '§2.4 The Fourier Inversion Formula',
        pageNumber: 78,
        equationLatex: '\\hat{f}(\\xi) = \\int_{\\mathbb{R}} f(x) e^{-2\\pi i x \\xi} dx',
        excerpt: 'The continuous Fourier transform establishes an isometry on L2(R), mapping convolution in time directly to algebraic pointwise multiplication in the frequency domain.',
        relevanceScore: 0.98,
        videoTimestamp: 15
      },
      {
        id: 'cit_02',
        bookTitle: 'Linear Systems and Signals (Lathi)',
        section: '§4.2 Spectrum Decomposition of Periodic & Aperiodic Signals',
        pageNumber: 215,
        equationLatex: 'E = \\int |f(t)|^2 dt = \\int |\\hat{f}(\\xi)|^2 d\\xi',
        excerpt: 'Parseval’s relation demonstrates energy conservation between physical temporal waveforms and the continuous spectrum of harmonic frequencies.',
        relevanceScore: 0.94,
        videoTimestamp: 23
      }
    ]
  },
  {
    id: 'gradient-descent',
    title: 'Gradient Descent & Loss Optimization in High Dimensions',
    category: 'Optimization & Machine Learning Theory',
    bloomLevel: 'Apply',
    duration: 30,
    description: 'Deriving Cauchy-Schwarz directional descent on non-convex manifolds, learning rate bounds, and Hessian curvature dynamics in deep neural training.',
    primaryEquation: '\\mathbf{\\theta}_{t+1} = \\mathbf{\\theta}_t - \\alpha \\nabla_{\\mathbf{\\theta}} \\mathcal{L}(\\mathbf{\\theta}_t)',
    interactiveType: 'gradient_descent',
    tags: ['Optimization', 'Cauchy-Schwarz', 'Hessian', 'Learning Rate', 'Neural Networks'],
    manimPythonCode: `from manim import *
import numpy as np

class GradientDescentScene(ThreeDScene):
    def construct(self):
        title = Title(r"\\text{Gradient Descent on Loss Landscapes}")
        self.add_fixed_in_frame_mobjects(title)
        self.play(Write(title))

        self.set_camera_orientation(phi=65 * DEGREES, theta=30 * DEGREES)

        surface = Surface(
            lambda u, v: np.array([u, v, 0.4 * (u**2 + 2 * v**2)]),
            u_range=[-2.5, 2.5],
            v_range=[-2, 2],
            resolution=(24, 24)
        ).set_color_by_gradient(BLUE, TEAL, YELLOW, RED)
        
        self.play(Create(surface), run_time=2.5)

        start_pt = np.array([2.0, 1.5, 0.4 * (4.0 + 2 * 2.25)])
        ball = Sphere(radius=0.15, color=WHITE).move_to(start_pt)
        self.play(FadeIn(ball))

        grad_arrow = Arrow3D(
            start=start_pt,
            end=start_pt + np.array([-0.6, -0.8, -0.7]),
            color=YELLOW
        )
        self.play(Create(grad_arrow))
        self.wait(2)
`,
    steps: [
      {
        id: 'gd_step_1',
        stepNumber: 1,
        label: 'First-Order Taylor Expansion',
        latex: '\\mathcal{L}(\\mathbf{w} + \\Delta\\mathbf{w}) \\approx \\mathcal{L}(\\mathbf{w}) + \\nabla\\mathcal{L}(\\mathbf{w})^T \\Delta\\mathbf{w}',
        explanation: 'In the infinitesimal neighborhood of current weights w, the change in loss is governed by the directional inner product with the gradient vector.',
        sympyRule: 'Multivariable Taylor Series Expansion',
        timestampStart: 0,
      },
      {
        id: 'gd_step_2',
        stepNumber: 2,
        label: 'Cauchy-Schwarz Steepest Descent',
        latex: '\\min_{\\|\\Delta\\mathbf{w}\\| = \\epsilon} \\nabla\\mathcal{L}^T \\Delta\\mathbf{w} \\implies \\Delta\\mathbf{w} = -\\epsilon \\frac{\\nabla\\mathcal{L}}{\\|\\nabla\\mathcal{L}\\|}',
        explanation: 'The inner product is minimized when the step vector is precisely anti-parallel to the gradient vector field.',
        sympyRule: 'Cauchy-Schwarz Variational Inequality',
        timestampStart: 8,
      },
      {
        id: 'gd_step_3',
        stepNumber: 3,
        label: 'Discrete Parameter Update Rule',
        latex: '\\mathbf{w}_{t+1} = \\mathbf{w}_t - \\alpha \\nabla_{\\mathbf{w}} \\mathcal{L}(\\mathbf{w}_t)',
        explanation: 'Absorbing step scale epsilon and inverse norm into scalar learning rate alpha gives the canonical update rule.',
        sympyRule: 'Euler Forward Integration Step',
        timestampStart: 16,
      },
      {
        id: 'gd_step_4',
        stepNumber: 4,
        label: 'Lipschitz Gradient Stability Bound',
        latex: '0 < \\alpha < \\frac{2}{L_{\\max}(\\nabla^2 \\mathcal{L})}',
        explanation: 'Convergence is strictly guaranteed only when the learning rate is bounded by twice the reciprocal of the maximum Hessian eigenvalue.',
        sympyRule: 'Spectral Radius Contraction Mapping',
        timestampStart: 23,
      },
    ],
    cues: [
      {
        id: 'cue_gd_01',
        timestamp: 0,
        endTimestamp: 8,
        text: 'To train modern neural networks, we minimize a scalar loss function defined over millions of parameter dimensions.',
        activeLatexId: 'gd_step_1',
        action: 'Write(title)'
      },
      {
        id: 'cue_gd_02',
        timestamp: 8,
        endTimestamp: 16,
        text: 'By the Cauchy-Schwarz inequality, the direction that causes the steepest local decrease in loss is strictly negative to the gradient.',
        activeLatexId: 'gd_step_2',
        action: 'Create(surface)'
      },
      {
        id: 'cue_gd_03',
        timestamp: 16,
        endTimestamp: 23,
        text: 'We scale this step by the learning rate alpha. Too small a rate slows convergence; too large causes catastrophic oscillation and divergence.',
        activeLatexId: 'gd_step_3',
        action: 'Create(grad_arrow)'
      },
      {
        id: 'cue_gd_04',
        timestamp: 23,
        endTimestamp: 30,
        text: 'The Lipschitz constant and Hessian curvature dictate the exact stability threshold to reach the local valley optimum.',
        activeLatexId: 'gd_step_4',
        action: 'MoveAlongPath(ball, descent_path)'
      }
    ],
    citations: [
      {
        id: 'cit_gd_01',
        bookTitle: 'Deep Learning (Adaptive Computation and Machine Learning series)',
        section: '§4.3 Gradient-Based Optimization',
        pageNumber: 142,
        equationLatex: '\\mathbf{\\theta}_{t+1} = \\mathbf{\\theta}_t - \\alpha \\mathbf{g}',
        excerpt: 'Gradient descent proposes a new point by moving in the direction of the negative gradient. When the Hessian condition number is high, gradient descent performs poorly, requiring momentum or adaptive preconditioners.',
        relevanceScore: 0.99,
        videoTimestamp: 16
      }
    ]
  },
  {
    id: 'maxwell-equations',
    title: "Maxwell's Equations & The Displacement Current",
    category: 'Electrodynamics & Field Theory',
    bloomLevel: 'Evaluate',
    duration: 30,
    description: 'How Maxwell resolved the mathematical contradiction between Ampère’s law and charge conservation by introducing the displacement current, predicting light.',
    primaryEquation: '\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J} + \\mu_0 \\epsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}',
    interactiveType: 'maxwell',
    tags: ['Maxwell', 'Displacement Current', 'Ampere Law', 'Charge Conservation', 'Electromagnetism'],
    manimPythonCode: `from manim import *

class MaxwellDisplacementScene(Scene):
    def construct(self):
        title = Title(r"\\text{Maxwell's Displacement Current}")
        self.play(Write(title))

        ampere_old = MathTex(
            r"\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J}",
            color=RED
        ).scale(1.1).shift(UP * 1.5)
        self.play(Write(ampere_old))
        self.wait(1.5)

        div_curl = MathTex(
            r"\\nabla \\cdot (\\nabla \\times \\mathbf{B}) = 0 \\quad \\neq \\quad \\mu_0 \\nabla \\cdot \\mathbf{J}",
            color=YELLOW
        ).next_to(ampere_old, DOWN)
        self.play(Write(div_curl))
        self.wait(2)

        maxwell_final = MathTex(
            r"\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J} + \\mu_0 \\epsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}",
            color=GREEN_B
        ).scale(1.2).shift(DOWN * 1.5)
        
        self.play(Transform(div_curl, maxwell_final))
        self.wait(2)
`,
    steps: [
      {
        id: 'mx_step_1',
        stepNumber: 1,
        label: "Ampère's Original Incomplete Law",
        latex: '\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J}',
        explanation: 'Originally derived by Ampère for steady magnetostatic currents where charges do not accumulate over time.',
        sympyRule: 'Magnetostatic Field Axiom',
        timestampStart: 0,
      },
      {
        id: 'mx_step_2',
        stepNumber: 2,
        label: 'Mathematical Inconsistency via Vector Calculus',
        latex: '\\nabla \\cdot (\\nabla \\times \\mathbf{B}) \\equiv 0 \\implies \\mu_0 \\nabla \\cdot \\mathbf{J} = 0',
        explanation: 'The divergence of the curl of any vector field is identically zero. This forces divergence of current density J to be zero, violating continuity.',
        sympyRule: 'Divergence-Curl Identity & Continuity Violation',
        timestampStart: 8,
      },
      {
        id: 'mx_step_3',
        stepNumber: 3,
        label: 'Charge Conservation & Continuity Equation',
        latex: '\\nabla \\cdot \\mathbf{J} = -\\frac{\\partial \\rho}{\\partial t} \\quad \\text{and} \\quad \\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\epsilon_0}',
        explanation: 'In time-varying fields (like charging a capacitor), charge density changes, so J divergence equals negative partial rho over partial t.',
        sympyRule: 'Gauss Law & Conservation of Charge',
        timestampStart: 16,
      },
      {
        id: 'mx_step_4',
        stepNumber: 4,
        label: "Maxwell's Complete Equation of Electromagnetism",
        latex: '\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J} + \\mu_0 \\epsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}',
        explanation: 'Maxwell added the time-derivative of the electric displacement flux, directly predicting self-sustaining electromagnetic waves traveling at c.',
        sympyRule: 'Maxwell-Ampère Law',
        timestampStart: 23,
      },
    ],
    cues: [
      {
        id: 'cue_mx_01',
        timestamp: 0,
        endTimestamp: 8,
        text: 'In the nineteenth century, Ampère’s law accurately described magnetic fields around steady electric currents.',
        activeLatexId: 'mx_step_1',
        action: 'Write(ampere_old)'
      },
      {
        id: 'cue_mx_02',
        timestamp: 8,
        endTimestamp: 16,
        text: 'However, James Clerk Maxwell discovered a fatal mathematical contradiction when taking the divergence of both sides.',
        activeLatexId: 'mx_step_2',
        action: 'Write(div_curl)'
      },
      {
        id: 'cue_mx_03',
        timestamp: 16,
        endTimestamp: 23,
        text: 'Because divergence of curl is identically zero, Ampère’s law forbids charging capacitors, directly violating charge conservation.',
        activeLatexId: 'mx_step_3',
        action: 'ShowCapacitorFlux()'
      },
      {
        id: 'cue_mx_04',
        timestamp: 23,
        endTimestamp: 30,
        text: 'By adding the displacement current term, Maxwell reconciled the equations, unmasking that light is an electromagnetic wave.',
        activeLatexId: 'mx_step_4',
        action: 'Transform(div_curl, maxwell_final)'
      }
    ],
    citations: [
      {
        id: 'cit_mx_01',
        bookTitle: 'Classical Electrodynamics (Jackson)',
        section: '§6.1 Maxwell’s Displacement Current and Vector Potentials',
        pageNumber: 239,
        equationLatex: '\\mathbf{J}_D = \\epsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}',
        excerpt: 'The introduction of the displacement current was Maxwell’s great theoretical contribution. It was necessary to make the equations consistent with the conservation of charge and led immediately to the wave equation.',
        relevanceScore: 0.99,
        videoTimestamp: 23
      }
    ]
  },
  {
    id: 'quantum-bloch',
    title: 'Quantum Superposition & The Bloch Sphere Geometry',
    category: 'Quantum Computing & Qubit Kinematics',
    bloomLevel: 'Create',
    duration: 28,
    description: 'Visualizing single-qubit state space, pure state phase coherence, unitary quantum gates, and projective measurement statistics on the S² sphere.',
    primaryEquation: '|\\psi\\rangle = \\cos\\left(\\frac{\\theta}{2}\\right) |0\\rangle + e^{i\\phi}\\sin\\left(\\frac{\\theta}{2}\\right) |1\\rangle',
    interactiveType: 'quantum_bloch',
    tags: ['Quantum', 'Bloch Sphere', 'Qubit', 'Unitary Matrix', 'Hadamard Gate'],
    manimPythonCode: `from manim import *
import numpy as np

class BlochSphereScene(ThreeDScene):
    def construct(self):
        title = Title(r"\\text{The Quantum Bloch Sphere}")
        self.add_fixed_in_frame_mobjects(title)
        self.play(Write(title))

        self.set_camera_orientation(phi=70 * DEGREES, theta=45 * DEGREES)

        sphere = Sphere(radius=2.0, resolution=(18, 36))
        sphere.set_fill(BLUE_E, opacity=0.15)
        sphere.set_stroke(BLUE_B, width=1.0)
        self.play(Create(sphere), run_time=2.0)

        state_vec = Arrow3D(
            start=ORIGIN,
            end=np.array([1.4, 0.8, 1.2]),
            color=YELLOW
        )
        ket_psi = MathTex(r"|\\psi\\rangle", color=YELLOW)
        self.add_fixed_in_frame_mobjects(ket_psi)
        ket_psi.to_corner(DR)
        
        self.play(Create(state_vec), Write(ket_psi))
        self.wait(2)
`,
    steps: [
      {
        id: 'qb_step_1',
        stepNumber: 1,
        label: 'Two-State Quantum Superposition',
        latex: '|\\psi\\rangle = \\alpha |0\\rangle + \\beta |1\\rangle \\quad (\\alpha, \\beta \\in \\mathbb{C})',
        explanation: 'A pure qubit state is a linear combination of orthonormal computational basis states |0> and |1>.',
        sympyRule: 'Complex Hilbert Space Vector',
        timestampStart: 0,
      },
      {
        id: 'qb_step_2',
        stepNumber: 2,
        label: 'Born Probability Normalization',
        latex: '\\langle\\psi|\\psi\\rangle = |\\alpha|^2 + |\\beta|^2 = 1',
        explanation: 'Measurement outcomes must sum to unity, restricting state amplitudes to a 3-sphere in 4D real space.',
        sympyRule: 'Unitary Norm Constraint',
        timestampStart: 7,
      },
      {
        id: 'qb_step_3',
        stepNumber: 3,
        label: 'Global Phase Invariance Quotient',
        latex: '|\\psi\\rangle \\sim e^{i\\gamma}|\\psi\\rangle \\implies \\alpha \\in \\mathbb{R}^+, \\quad \\alpha = \\cos\\frac{\\theta}{2}',
        explanation: 'Because an overall global phase is physically unobservable, we fix alpha as real and positive, parameterized by polar angle theta.',
        sympyRule: 'Projective Hilbert Space U(1) Quotient',
        timestampStart: 14,
      },
      {
        id: 'qb_step_4',
        stepNumber: 4,
        label: 'Canonical Bloch Vector Representation',
        latex: '|\\psi\\rangle = \\cos\\left(\\frac{\\theta}{2}\\right) |0\\rangle + e^{i\\phi}\\sin\\left(\\frac{\\theta}{2}\\right) |1\\rangle',
        explanation: 'Every pure qubit state uniquely maps to a point on the unit 2-sphere S² with polar angle θ and azimuthal phase angle φ.',
        sympyRule: 'Bloch Sphere Homomorphism',
        timestampStart: 21,
      },
    ],
    cues: [
      {
        id: 'cue_qb_01',
        timestamp: 0,
        endTimestamp: 7,
        text: 'Unlike classical bits that are strictly 0 or 1, a quantum qubit lives in a continuous superposition of both states.',
        activeLatexId: 'qb_step_1',
        action: 'Write(title)'
      },
      {
        id: 'cue_qb_02',
        timestamp: 7,
        endTimestamp: 14,
        text: 'The Born rule requires the total measurement probability to equal one, bounding the complex amplitudes alpha and beta.',
        activeLatexId: 'qb_step_2',
        action: 'Create(sphere)'
      },
      {
        id: 'cue_qb_03',
        timestamp: 14,
        endTimestamp: 21,
        text: 'Since global phase has no physical effect on observables, we quotient out U(1) symmetry, yielding a 2D spherical surface.',
        activeLatexId: 'qb_step_3',
        action: 'Create(state_vec)'
      },
      {
        id: 'cue_qb_04',
        timestamp: 21,
        endTimestamp: 28,
        text: 'The polar angle theta sets the measurement probabilities, while phi dictates the quantum relative phase.',
        activeLatexId: 'qb_step_4',
        action: 'RotateVectorAroundZ()'
      }
    ],
    citations: [
      {
        id: 'cit_qb_01',
        bookTitle: 'Quantum Computation and Quantum Information (Nielsen & Chuang)',
        section: '§1.2 Multiple Qubits and the Bloch Sphere',
        pageNumber: 31,
        equationLatex: '\\vec{r} = (\\sin\\theta\\cos\\phi, \\sin\\theta\\sin\\phi, \\cos\\theta)',
        excerpt: 'The Bloch sphere provides a geometric representation of single qubit states. Pure states correspond to points on the boundary surface, while mixed states lie within the interior ball.',
        relevanceScore: 0.98,
        videoTimestamp: 21
      }
    ]
  }
];

export const INITIAL_DAG_NODES = [
  {
    id: 'calc_deriv',
    title: 'Single-Variable Differentiation',
    category: 'Calculus',
    prerequisites: [],
    bloomLevel: 'Remember' as const,
    masteryPercentage: 95,
    isUnlocked: true,
    summary: 'Rate of change, power rule, product rule, and chain rule.',
    keyFormula: "f'(x) = \\lim_{\\Delta x \\to 0} \\frac{f(x+\\Delta x) - f(x)}{\\Delta x}",
    x: 100,
    y: 120,
    questions: [
      {
        id: 'q1',
        bloomLevel: 'Remember',
        prompt: 'What is the derivative of e^{3x} with respect to x?',
        latex: '\\frac{d}{dx}[e^{3x}]',
        options: ['3e^{3x}', 'e^{3x}', '\\frac{1}{3}e^{3x}', '3xe^{3x}'],
        correctIndex: 0,
        explanation: 'By the chain rule, d/dx[e^{u}] = e^{u} * u\', so 3e^{3x}.'
      }
    ]
  },
  {
    id: 'lin_alg_vec',
    title: 'Vectors and Inner Products',
    category: 'Linear Algebra',
    prerequisites: [],
    bloomLevel: 'Remember' as const,
    masteryPercentage: 90,
    isUnlocked: true,
    summary: 'Euclidean spaces, dot products, vector orthogonality, and projections.',
    keyFormula: '\\mathbf{u} \\cdot \\mathbf{v} = \\|\\mathbf{u}\\|\\|\\mathbf{v}\\|\\cos\\theta',
    x: 100,
    y: 300,
    questions: [
      {
        id: 'q2',
        bloomLevel: 'Understand',
        prompt: 'If two non-zero vectors have an inner product equal to 0, what does this geometrically imply?',
        options: ['They are orthogonal (perpendicular)', 'They are parallel', 'They have equal length', 'They form a linear basis'],
        correctIndex: 0,
        explanation: 'cos(theta) = 0 implies theta = 90 degrees, i.e., orthogonality.'
      }
    ]
  },
  {
    id: 'multivar_grad',
    title: 'Multivariable Gradients',
    category: 'Calculus',
    prerequisites: ['calc_deriv'],
    bloomLevel: 'Understand' as const,
    masteryPercentage: 85,
    isUnlocked: true,
    summary: 'Partial derivatives, Jacobian vectors, and gradient vector fields.',
    keyFormula: '\\nabla f = \\left[ \\frac{\\partial f}{\\partial x_1}, \\dots, \\frac{\\partial f}{\\partial x_n} \\right]^T',
    x: 320,
    y: 120,
    questions: [
      {
        id: 'q3',
        bloomLevel: 'Apply',
        prompt: 'In which direction does the gradient vector point?',
        options: ['Direction of steepest ascent', 'Direction of steepest descent', 'Perpendicular to the surface normal', 'Along contour level curves'],
        correctIndex: 0,
        explanation: 'The gradient vector points in the direction of maximal positive rate of change.'
      }
    ]
  },
  {
    id: 'grad_descent',
    title: 'Gradient Descent & Loss Optimization',
    category: 'Optimization',
    prerequisites: ['multivar_grad', 'lin_alg_vec'],
    bloomLevel: 'Apply' as const,
    masteryPercentage: 78,
    isUnlocked: true,
    summary: 'Iterative parameter updates, step size learning rates, and convex landscapes.',
    keyFormula: '\\mathbf{\\theta}_{t+1} = \\mathbf{\\theta}_t - \\alpha \\nabla_{\\mathbf{\\theta}} \\mathcal{L}(\\mathbf{\\theta})',
    x: 540,
    y: 200,
    questions: [
      {
        id: 'q4',
        bloomLevel: 'Analyze',
        prompt: 'What happens if the learning rate alpha is set too high in non-convex optimization?',
        options: ['Oscillations and explosive divergence', 'Convergence to global minimum is accelerated', 'Hessian eigenvalues invert', 'Gradients vanish to zero'],
        correctIndex: 0,
        explanation: 'Overstepping the valley causes oscillation across the canyon walls and numerical divergence.'
      }
    ]
  },
  {
    id: 'fourier_series',
    title: 'Fourier Transform & Orthogonal Bases',
    category: 'Signal Analysis',
    prerequisites: ['calc_deriv', 'lin_alg_vec'],
    bloomLevel: 'Analyze' as const,
    masteryPercentage: 72,
    isUnlocked: true,
    summary: 'Decomposing arbitrary signals into rotating complex sinusoids.',
    keyFormula: '\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x) e^{-2\\pi i x \\xi} dx',
    x: 320,
    y: 300,
    questions: [
      {
        id: 'q5',
        bloomLevel: 'Analyze',
        prompt: 'Why is the continuous Fourier transform considered a continuous inner product with complex exponentials?',
        options: ['Because e^{-2pi i x xi} forms an orthogonal continuous basis over L2', 'Because Euler’s formula only works for integer harmonics', 'Because the Fourier kernel is always real-valued', 'Because it minimizes the second derivative'],
        correctIndex: 0,
        explanation: 'Complex exponentials form an orthogonal basis in Hilbert space L^2(R).'
      }
    ]
  },
  {
    id: 'quantum_bloch',
    title: 'Quantum Superposition & Bloch Sphere',
    category: 'Quantum Physics',
    prerequisites: ['lin_alg_vec'],
    bloomLevel: 'Evaluate' as const,
    masteryPercentage: 60,
    isUnlocked: true,
    summary: 'Single-qubit state space, unitary rotations, and quantum phase evolution.',
    keyFormula: '|\\psi\\rangle = \\cos\\frac{\\theta}{2} |0\\rangle + e^{i\\phi}\\sin\\frac{\\theta}{2} |1\\rangle',
    x: 540,
    y: 380,
    questions: [
      {
        id: 'q6',
        bloomLevel: 'Evaluate',
        prompt: 'What is the probability of measuring state |0> given a qubit at the equator with theta = pi/2?',
        options: ['0.5 (50%)', '1.0 (100%)', '0.0 (0%)', '0.25 (25%)'],
        correctIndex: 0,
        explanation: 'P(|0>) = |cos(pi/4)|^2 = (1/sqrt(2))^2 = 0.5.'
      }
    ]
  },
  {
    id: 'backprop_neural',
    title: 'Reverse-Mode Autodiff & Backpropagation',
    category: 'Machine Learning',
    prerequisites: ['grad_descent'],
    bloomLevel: 'Create' as const,
    masteryPercentage: 45,
    isUnlocked: true,
    summary: 'Computational DAG traversal, adjoint sensitivities, and chain rule caching.',
    keyFormula: '\\frac{\\partial \\mathcal{L}}{\\partial w_{ij}} = \\delta_j \\cdot a_i',
    x: 760,
    y: 200,
    questions: [
      {
        id: 'q7',
        bloomLevel: 'Create',
        prompt: 'Why does reverse-mode automatic differentiation have O(1) complexity relative to the number of input parameters for scalar loss?',
        options: ['Because intermediate adjoint sensitivities are cached during forward pass and propagated once backwards', 'Because the Jacobian matrix is diagonal', 'Because neural networks are always strictly linear', 'Because gradients cancel out due to symmetry'],
        correctIndex: 0,
        explanation: 'Forward pass caches activations; backward pass traverses backwards once from scalar loss.'
      }
    ]
  }
];
