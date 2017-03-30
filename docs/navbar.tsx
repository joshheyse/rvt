import * as React from 'react';
import { Link } from 'react-router';
import { MenuItem, Nav, Navbar, NavDropdown } from 'react-bootstrap';
// import { LinkContainer } from 'react-router-bootstrap';

export default class NavBar extends React.Component<{
}, {}> {
  public render() {

    return (
      <Navbar fluid>
        <Navbar.Header>
          <Navbar.Brand>
            <Link to='/'>React-Virtual-Table</Link>
          </Navbar.Brand>
          <Navbar.Toggle />
        </Navbar.Header>
        <Navbar.Collapse>
          <Nav>
            <NavDropdown title='Examples' id='examples-dropdown'>
              <MenuItem href='/examples/Grid'>Grid</MenuItem>
              <MenuItem href='/examples/Style'>Style</MenuItem>
              <MenuItem href='/examples/VirtualTable'>Virtual Table</MenuItem>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );
  }
}
