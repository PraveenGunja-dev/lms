# lmsdms_backend
BPL - LMS &amp; DMS

Vasu add example response of Question bank
{
    "questions": [
        {
            "question_text": "What is the capital of France?",
            "question_type": "mcq",
            "options": [
                {"text": "Paris", "is_correct": true},
                {"text": "London", "is_correct": false},
                {"text": "Rome", "is_correct": false},
                {"text": "Berlin", "is_correct": false}
            ]
        },
        {
            "question_text": "True or False: The Earth is flat.",
            "question_type": "true_false",
            "options": [
                {"text": "True", "is_correct": false},
                {"text": "False", "is_correct": true}
            ]
        },
        {
            "question_text": "Upload an image or video that explains Newton's laws.",
            "question_type": "image_video",
            "media_url": "https://example.com/media/file.mp4"
        }
    ]
}


## Setup & deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for configuration, migrations, tests and behaviour changes.
