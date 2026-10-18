from typing import List, Optional, Any, Dict, Union
from pydantic import BaseModel, Field

# --- Auth Models ---
class TeacherLoginRequest(BaseModel):
    username: str
    password: str

class TeacherRegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str

# --- Task Models for Teacher ---
class TaskItem(BaseModel):
    id: Optional[str] = None
    test_id: Optional[str] = None
    order_index: int = 1
    question_text: str
    question_type: str  # 10 автопроверяемых типов:
                        # 'single_choice', 'multi_choice', 'number', 'short_text',
                        # 'fill_blank', 'true_false', 'ordering', 'matching',
                        # 'dropdown', 'group_classification', 'text_manual'
    options: Optional[List[str]] = []
    max_score: float = 1.0
    descriptor: Optional[str] = ""
    check_method: Optional[str] = "exact"  # 'exact', 'partial', 'all_or_nothing', 'case_sensitive', 'case_insensitive'
    tolerance: Optional[float] = 0.0
    answer_key: Any = None
    comment_explanation: Optional[str] = ""
    image_url: Optional[str] = None
    image_size: Optional[str] = "100%"    # '200px', '400px', '100%'
    image_align: Optional[str] = "center" # 'left', 'center', 'right'
    categories: Optional[List[str]] = []  # Для group_classification: ['Категория А', 'Категория Б']
    variant: Optional[str] = "1"          # '1', '2' или 'all'

# --- Student-Safe Task Model (NO KEYS, NO EXPLANATIONS) ---
class StudentTaskView(BaseModel):
    id: str
    order_index: int
    question_text: str
    question_type: str
    options: Optional[List[str]] = []
    max_score: float
    descriptor: Optional[str] = ""
    image_url: Optional[str] = None
    image_size: Optional[str] = "100%"
    image_align: Optional[str] = "center"
    categories: Optional[List[str]] = []
    match_items_left: Optional[List[str]] = []
    match_items_right: Optional[List[str]] = []
    variant: Optional[str] = "1"
    # Strictly NO answer_key, NO comment_explanation, NO tolerance!

# --- Test Models ---
class CreateTestRequest(BaseModel):
    title: str
    exam_type: str = "СОР"  # 'СОР' или 'СОЧ'
    subject: str
    grade_level: str        # '9', '10 ЕМН', '10 ОГН', '11'
    class_letters: Optional[List[str]] = [] # ['А', 'Б', 'В', ...]
    variant: Optional[str] = "1"
    quarter: int = 1
    section: Optional[str] = ""
    instructions: Optional[str] = ""
    learning_objectives: Optional[str] = ""
    assessment_criteria: Optional[str] = ""
    bg_color: Optional[str] = "#f8fafc"
    bg_color_v1: Optional[str] = "#fce8e6"
    bg_color_v2: Optional[str] = "#e6f4ea"
    has_variants: Optional[bool] = True
    shuffle_options: bool = False

class UpdateTestRequest(CreateTestRequest):
    is_archived: Optional[bool] = False

# --- Launch Models ---
class CreateLaunchRequest(BaseModel):
    test_id: str
    title: Optional[str] = None
    allowed_classes: List[str]
    manual_approval: bool = False
    duration_minutes: int = 45
    scheduled_start: Optional[str] = None
    scheduled_end: Optional[str] = None
    timezone: str = "Asia/Qyzylorda"
    shuffle_questions: bool = False
    shuffle_options: Optional[bool] = None
    allow_back_nav: bool = True
    show_all_at_once: bool = True
    publish_scores: bool = False
    publish_answers: bool = False
    publish_comments: bool = False
    bg_color: Optional[str] = "#f8fafc"
    bg_color_v1: Optional[str] = "#fce8e6"
    bg_color_v2: Optional[str] = "#e6f4ea"

class UpdateLaunchStatusRequest(BaseModel):
    status: str  # 'draft', 'waiting', 'active', 'closed_entry', 'finished'

class UpdateLaunchSettingsRequest(BaseModel):
    manual_approval: Optional[bool] = None
    duration_minutes: Optional[int] = None
    publish_scores: Optional[bool] = None
    publish_answers: Optional[bool] = None
    publish_comments: Optional[bool] = None
    scheduled_start: Optional[str] = None
    scheduled_end: Optional[str] = None
    bg_color: Optional[str] = None
    bg_color_v1: Optional[str] = None
    bg_color_v2: Optional[str] = None

# --- Student Interaction Models ---
class StudentJoinRequest(BaseModel):
    student_name: str
    student_class: str
    variant: Optional[str] = "1"
    desk_number: Optional[str] = None

class CreateBackupRequest(BaseModel):
    name: Optional[str] = None

class SaveAnswerRequest(BaseModel):
    task_id: str
    answer: Any
    version: int

class BatchSaveAnswersRequest(BaseModel):
    answers: List[SaveAnswerRequest]

class StudentSubmitRequest(BaseModel):
    final_confirmation: bool = True
    answers: Optional[Dict[str, Any]] = None

# --- Teacher Grading & Live Control ---
class TeacherActionStudentRequest(BaseModel):
    action: str  # 'admit', 'remove', 'block', 'unblock', 'add_time', 'allow_extra_attempt', 'reset_session'
    extra_minutes: Optional[int] = 0
    reason: Optional[str] = ""

class GradeSingleAnswerRequest(BaseModel):
    attempt_id: str
    task_id: str
    score: float
    teacher_comment: Optional[str] = ""

class RosterImportRequest(BaseModel):
    class_name: str
    students: List[str]

# --- Site Lesson Page Generation ---
class CreateLessonPageRequest(BaseModel):
    grade_folder: str    # e.g. "9 класс", "10 ЕМН", "10 ОГН", "11 класс"
    quarter_folder: str  # e.g. "1 четверть", "2 четверть", "3 четверть", "4 четверть"
    lesson_number: str   # e.g. "7 урок" или "СОР 1"
    lesson_title: str
    launch_id: str

class DeleteLessonPageRequest(BaseModel):
    grade_folder: Optional[str] = None
    quarter_folder: Optional[str] = None
    lesson_number: Optional[str] = None
    relative_path: Optional[str] = None

