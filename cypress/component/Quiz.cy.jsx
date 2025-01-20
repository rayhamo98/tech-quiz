import Quiz from '../../client/src/components/Quiz';

describe('Quiz Component', () => {
    beforeEach(() => {
        cy.mount(<Quiz />);
    });

    it('should display "Start Quiz" button initially', () => {
        cy.contains('button', 'Start Quiz').should('be.visible');
    });

    it('should fetch and display questions when the quiz starts', () => {
        cy.intercept('GET', '**/api/questions/random', { fixture: 'questions.json' }).as('getQuestions');
        cy.mount(<Quiz />);
        cy.get('button').contains('Start Quiz').click();
        cy.wait('@getQuestions');
        cy.get('h2').should('be.visible');
    });

    it('should display a loading spinner while fetching questions', () => {
        cy.intercept('GET', '**/api/questions/random', (req) => {
            // Initially return an empty array to trigger loading state
            req.reply((res) => {
                res.send([]); // Send an empty array immediately to show spinner
                setTimeout(() => {
                    res.send({ fixture: 'questions.json' }); // Load actual data after delay
                }, 5000);
            });
        }).as('getQuestions');

        cy.mount(<Quiz />);
        cy.get('button').contains('Start Quiz').click();
        // Now, check for the spinner
        cy.get('.spinner-border', { timeout: 6000 }).should('be.visible');
        cy.wait('@getQuestions');
    });

    // This test needs work.  In theory a spy function should be able to get the score mid quiz.
    //   it('should update score on correct answer selection', () => {
    //     cy.intercept('GET', '**/api/questions/random', { fixture: 'questions.json' }).as('getQuestions');
    //     const setScoreSpy = cy.spy().as('setScoreSpy');
    //     cy.mount(<Quiz setScore={setScoreSpy} />);
    //     cy.get('button').contains('Start Quiz').click();
    //     cy.wait('@getQuestions');
    //     cy.get('.btn').contains('1').click(); // assuming the first answer is correct in the fixture
    //     cy.get('@setScoreSpy').should('have.been.calledWith', 1); // Assert that setScore is called with the incremented score
    //   });

    it('should show "Quiz Completed" message at the end', () => {
        cy.intercept('GET', '**/api/questions/random', { fixture: 'questions.json' }).as('getQuestions');
        cy.mount(<Quiz />);
        cy.get('button').contains('Start Quiz').click();
        cy.wait('@getQuestions');
        // Load the fixture to get the number of questions
        cy.fixture('questions.json').then((questions) => {
            const questionCount = questions.length; // Get the number of questions in the fixture
            // Loop through the number of questions and click the first answer each time
            for (let i = 0; i < questionCount; i++) {
                cy.get('.btn').contains('1').click(); // Click the first answer button each time
            }
            // After the last question, check that "Quiz Completed" is visible
            cy.contains('Quiz Completed').should('be.visible');
        });
    });

    it('should reset quiz on clicking "Take New Quiz"', () => {
        cy.intercept('GET', '**/api/questions/random', { fixture: 'questions.json' }).as('getQuestions');
        cy.mount(<Quiz />);
        cy.contains('Start Quiz').click();
        cy.wait('@getQuestions');
      
        // Complete the quiz
        cy.fixture('questions.json').then((questions) => {
          questions.forEach((question) => {
            const correctAnswer = question.answers.find(answer => answer.isCorrect).text;
            cy.contains('.alert-secondary', correctAnswer)
              .parent()
              .find('button')
              .click();
          });
      
          // Verify completion
          cy.contains('Quiz Completed').should('be.visible');
          cy.contains('Take New Quiz').click();
      
          // Check that it resets to the initial state
          cy.get('.card h2').should('not.contain', 'Quiz Completed');
        });
      });
});
