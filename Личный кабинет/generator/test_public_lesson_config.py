import json
import re
import unittest
import server


class PublicLessonConfig(unittest.TestCase):
    def test_public_lesson_only_embeds_variant_statistics(self):
        tasks = [{'id':'private-task', 'variant':'1', 'max_score':2,
                  'question_text':'PRIVATE QUESTION', 'answer_key':'PRIVATE ANSWER',
                  'answer_key_json':'PRIVATE ANSWER', 'comment_explanation':'PRIVATE EXPLANATION'}]
        html = server.generate_native_lesson_html('10 ЕМН', '1 четверть', '13', 'СОЧ', 'test-launch', tasks)
        config = json.loads(re.search(r'<script id="exam-embedded-config" type="application/json">(.*?)</script>', html, re.S)[1])
        self.assertEqual(config['tasks'], [{'variant':'1', 'max_score':2}])
        self.assertEqual(config['launch_id'], 'test-launch')
        for private in ['PRIVATE QUESTION', 'PRIVATE ANSWER', 'PRIVATE EXPLANATION', 'private-task']:
            self.assertNotIn(private, html)


if __name__ == '__main__':
    unittest.main()
