const questions = require('./questions.json');
const { Random } = require('random-js');


const getRandomQuestion = (topic) => {
    const questionTopic = topic.toLowerCase();
    const random = new Random();
    const randomQuestionIndex = random.integer(0, questions[questionTopic].length - 1)
    return questions[questionTopic][randomQuestionIndex];
};


const getCorrectAnswer = (topic, id) => {
    console.log(topic)
    const question = questions[topic].find((qstn) => qstn.id === id);
    if (!question.hasOptions) {
        return question.answer;
    }
    return question.options.find((option) => option.isCorrect).text;


};

module.exports = { getRandomQuestion, getCorrectAnswer };