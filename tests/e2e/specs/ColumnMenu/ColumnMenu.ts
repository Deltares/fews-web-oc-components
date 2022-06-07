describe('ColumnMenu', () => {
  it('should update the menu when clicked on a child', () => {
    cy.visit('http://localhost:6006/iframe.html?id=columnmenu--default')
    cy.get('.list-item--13').click()
    console.log(cy)
    cy.get('.v-toolbar__title').should('contain.text', 'child3')
  })
})
