describe('DateTimeSlider', () => {
  it('should respond to click on button with warning', () => {
    cy.visit('http://localhost:6006/iframe.html?id=datetimeslider--default')
    cy.get('.now-button').click()
    cy.get('.now-text').should('contain.text', ' 10/21/2021, 2:00:00 AM')
  })
})
