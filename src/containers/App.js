import React from 'react'
import PropTypes from 'prop-types'
import { Router, Route, Switch, Redirect } from 'react-router-dom'
import { Dimmer, Loader } from 'semantic-ui-react'
import { connect } from 'react-redux'
import throttle from 'lodash/throttle'
import routes from '../router/routes'
import Auth from './Auth'
import InitialSetup from './InitialSetup'
import SidebarMenu from './SidebarMenu'
import Header from '../components/Header'
import DemoNotice from './DemoNotice'
import SyncWarning from './SyncWarning'
import { windowResize } from '../actions/ui/windowResize'
import { toggleSidebar } from '../actions/ui/sidebar'
import { bootstrap } from '../actions/app'

class App extends React.Component {
  componentWillMount() {
    window.addEventListener('resize', throttle(this.props.windowResize, 500))
  }

  componentDidMount() {
    this.props.bootstrap()
  }

  render() {
    if (!this.props.isLoaded) {
      return (
        <Loader
          active
          content={
            this.props.isSyncRunning &&
            'Synchronizing data, this might take a moment...'
          }
        />
      )
    }

    return (
      <Router history={this.props.history}>
        <Switch>
          <Route path="/auth" exact={true} component={Auth} />
          {!this.props.isSetupComplete ? (
            <Route component={InitialSetup} />
          ) : (
            <Route render={this.renderNavigationRoutes} />
          )}
        </Switch>
      </Router>
    )
  }

  /**
   * Navigation routes are the pages associated to navigation menu items,
   * e.g. Dashboard, Transactions, Settings etc.
   * They are rendered with common structure: sidebar menu and sticky header.
   */
  renderNavigationRoutes = () => {
    if (window.location.pathname.endsWith('index.html')) {
      return <Redirect to="/" />
    }
    const { isSidebarOpen, isMobile, toggleSidebar } = this.props
    return (
      <div
        className={isSidebarOpen || !isMobile ? 'openSidebar' : 'closedSidebar'}
        onClick={isSidebarOpen ? toggleSidebar : undefined}
      >
        <SidebarMenu />
        <Dimmer.Dimmable
          className="container"
          onClick={isSidebarOpen ? toggleSidebar : undefined}
        >
          {flatten(routes).map(route => (
            <Route
              key={route.path}
              path={route.path}
              exact={route.exact}
              render={props => (
                <div>
                  <Dimmer
                    active={isMobile && isSidebarOpen}
                    onClick={toggleSidebar}
                  />
                  <Header label={route.label} />
                  <DemoNotice />
                  <SyncWarning />
                  <route.component {...props} />
                </div>
              )}
            />
          ))}
        </Dimmer.Dimmable>
      </div>
    )
  }
}

function flatten(routes) {
  let flatRoutes = []
  routes.forEach(route => {
    if (route.routes) {
      flatRoutes.push({ ...route, exact: true })
      flatRoutes.push(...flatten(route.routes))
    } else {
      flatRoutes.push(route)
    }
  })

  return flatRoutes
}

App.propTypes = {
  history: PropTypes.object.isRequired,
  isLoaded: PropTypes.bool,
  isSyncRunning: PropTypes.bool,
  isSetupComplete: PropTypes.bool,
  isMobile: PropTypes.bool,
  isSidebarOpen: PropTypes.bool,
  bootstrap: PropTypes.func,
  windowResize: PropTypes.func,
  toggleSidebar: PropTypes.func
}

const mapStateToProps = (state, ownProps) => ({
  history: ownProps.history,
  isLoaded: state.settings.isLoaded,
  isSyncRunning: state.ui.sync.isRunning,
  isSetupComplete: state.settings.isSetupComplete,
  isMobile: state.ui.isMobile,
  isSidebarOpen: state.ui.isSidebarOpen
})

export default connect(mapStateToProps, {
  bootstrap,
  windowResize,
  toggleSidebar
})(App)
