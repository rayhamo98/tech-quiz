describe('Quiz App E2E', () => {
    beforeEach(() => {
        cy.visit('/'); // Ensure baseUrl is set correctly in Cypress configuration
    });

    it('should start the quiz and display the first question', () => {
        cy.intercept('GET', '**/api/questions/random', { fixture: 'questions.json' }).as('getQuestions');

        // Start the quiz
        cy.contains('Start Quiz').click();

        // Dynamically check the first question based on fixture data
        cy.fixture('questions.json').then((questions) => {
            cy.get('.card h2').should('contain', questions[0].question); // Use the first question's text
        });
    });

    // As with Component this is theoretically possible without modifying the react component
    // it('should increase the score for correct answers', () => {
    //   // Start the quiz
    //   cy.contains('Start Quiz').click();

    //   // Answer the first question correctly
    //   cy.fixture('questions.json').then((questions) => {
    //     const correctAnswer = questions[0].answers.find(answer => answer.isCorrect).text;
    //     cy.contains(correctAnswer).click(); // Click the correct answer

    //     // Verify score update - adapt the selector if score display is added
    //     cy.get('[data-testid="score"]').should('contain', 'Current Score: 1');
    //   });
    // });

    it('should complete the quiz and show the final score', () => {
        cy.intercept('GET', '**/api/questions/random', { fixture: 'questions.json' }).as('getQuestions');

        // Start the quiz
        cy.contains('Start Quiz').click();

        // Wait for the questions to load from the fixture
        cy.wait('@getQuestions');

        // Load fixture data and iterate through each question
        cy.fixture('questions.json').then(async (questions) => {
            for (const question of questions) {
                // Find the correct answer for the current question
                const correctAnswerText = question.answers.find(answer => answer.isCorrect).text;

                // Find the correct answer's button by locating the text and then its parent button
                await cy.contains('.alert-secondary', correctAnswerText)
                    .parent() // Find the parent `div` that contains both the button and text
                    .find('button') // Select the button within this parent
                    .click();
            }

            // After completing all questions, check for the "Quiz Completed" message
            cy.contains('Quiz Completed').should('be.visible');

            // Verify the final score equals the number of questions
            cy.get('.alert-success').should('contain', `Your score: ${questions.length}`);
        });
    });

    it('should reset the quiz after completion', () => {
        cy.intercept('GET', '**/api/questions/random', { fixture: 'questions.json' }).as('getQuestions');
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

            // Verify completion message
            cy.contains('Quiz Completed').should('be.visible');
            cy.get('.alert-success').should('contain', `Your score: ${questions.length}`);

            // Click to reset the quiz
            cy.contains('Take New Quiz').click();

            // Verify that quiz resets
            cy.get('.card h2').should('not.contain', 'Quiz Completed');
        });
    });

});
