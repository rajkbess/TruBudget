import React, { Component } from 'react';
import { connect } from 'react-redux';


import { fetchAllProjectDetails, showSubprojectDialog, onSubprojectDialogCancel, storeSubProjectCurrency, createSubProject, storeSubProjectName, storeSubProjectAmount, storeSubProjectComment, setCurrentStep } from './actions';
import SubProjects from './SubProjects'
import { showSnackBar, storeSnackBarMessage, showHistory } from '../Notifications/actions';
import { setSelectedView } from '../Navbar/actions';
import ProjectDetails from './ProjectDetails';
import globalStyles from '../../styles';
import RefreshIndicatorContainer from '../Loading/RefreshIndicatorContainer';

class SubProjectsContainer extends Component {
  componentWillMount() {
    const projectId = this.props.location.pathname.split('/')[2];
    this.props.setSelectedView(projectId, 'project');
    this.props.fetchAllProjectDetails(projectId, Date.now());

  }

  render() {
    return (
      <div>
        <RefreshIndicatorContainer {...this.props} />
        <div style={globalStyles.innerContainer}>
          <ProjectDetails {...this.props} />
          <SubProjects {...this.props} />
        </div>
      </div>
    )
  }
}
;


const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    fetchAllProjectDetails: (projectId) => dispatch(fetchAllProjectDetails(projectId)),
    showSubprojectDialog: () => dispatch(showSubprojectDialog()),
    onSubprojectDialogCancel: () => dispatch(onSubprojectDialogCancel()),
    storeSubProjectName: (name) => dispatch(storeSubProjectName(name)),
    createSubProject: (subprojectName, amount, comment, currency, parentName) => dispatch(createSubProject(parentName, subprojectName, amount, comment, currency)),
    storeSubProjectAmount: (amount) => dispatch(storeSubProjectAmount(amount)),
    storeSubProjectComment: (comment) => dispatch(storeSubProjectComment(comment)),
    storeSubProjectCurrency: (currency) => dispatch(storeSubProjectCurrency(currency)),
    showSnackBar: () => dispatch(showSnackBar(true)),
    storeSnackBarMessage: (message) => dispatch(storeSnackBarMessage(message)),
    openHistory: () => dispatch(showHistory(true)),
    hideHistory: () => dispatch(showHistory(false)),
    setSelectedView: (id, section) => dispatch(setSelectedView(id, section)),
    setCurrentStep: (step) => dispatch(setCurrentStep(step)),
  };
}

const mapStateToProps = (state) => {
  return {
    projectName: state.getIn(['detailview', 'projectName']),
    projectAmount: state.getIn(['detailview', 'projectAmount']),
    projectComment: state.getIn(['detailview', 'projectComment']),
    projectCurrency: state.getIn(['detailview', 'projectCurrency']),
    projectStatus: state.getIn(['detailview', 'projectStatus']),
    projectTS: state.getIn(['detailview', 'projectTS']),
    projectApprover: state.getIn(['detailview', 'projectApprover']),
    projectAssignee: state.getIn(['detailview', 'projectAssignee']),
    projectBank: state.getIn(['detailview', 'projectBank']),
    subProjects: state.getIn(['detailview', 'subProjects']).toJS(),
    subprojectsDialogVisible: state.getIn(['detailview', 'subprojectsDialogVisible']),
    subProjectName: state.getIn(['detailview', 'subProjectName']),
    subProjectAmount: state.getIn(['detailview', 'subProjectAmount']),
    subProjectComment: state.getIn(['detailview', 'subProjectComment']),
    currentStep: state.getIn(['detailview', 'currentStep']),
    subProjectCurrency: state.getIn(['detailview', 'subProjectCurrency']),
    showHistory: state.getIn(['notifications', 'showHistory']),
    historyItems: state.getIn(['notifications', 'historyItems']),
    loggedInUser: state.getIn(['login', 'loggedInUser']).toJS(),
    users: state.getIn(['login', 'users']).toJS(),
    roles: state.getIn(['login', 'roles']).toJS(),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SubProjectsContainer);
