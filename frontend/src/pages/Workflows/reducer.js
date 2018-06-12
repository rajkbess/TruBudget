import { fromJS } from "immutable";

import {
  SHOW_CREATE_DIALOG,
  WORKFLOW_NAME,
  WORKFLOW_AMOUNT,
  WORKFLOW_AMOUNT_TYPE,
  WORKFLOW_PURPOSE,
  WORKFLOW_CURRENCY,
  CREATE_WORKFLOW_SUCCESS,
  EDIT_WORKFLOW_ITEM_SUCCESS,
  SHOW_WORKFLOW_DETAILS,
  UPDATE_WORKFLOW_SORT,
  ENABLE_WORKFLOW_SORT,
  ENABLE_BUDGET_EDIT,
  SUBPROJECT_AMOUNT,
  WORKFLOW_CREATION_STEP,
  FETCH_ALL_SUBPROJECT_DETAILS_SUCCESS,
  HIDE_CREATE_DIALOG,
  WORKFLOW_STATUS,
  SHOW_SUBPROJECT_PERMISSIONS,
  HIDE_SUBPROJECT_PERMISSIONS,
  FETCH_SUBPROJECT_PERMISSIONS_SUCCESS,
  SHOW_WORKFLOWITEM_PERMISSIONS,
  HIDE_WORKFLOWITEM_PERMISSIONS,
  FETCH_WORKFLOWITEM_PERMISSIONS_SUCCESS,
  SHOW_WORKFLOW_ASSIGNEES,
  HIDE_WORKFLOW_ASSIGNEES,
  SHOW_SUBPROJECT_ASSIGNEES,
  HIDE_SUBPROJECT_ASSIGNEES,
  FETCH_SUBPROJECT_HISTORY_SUCCESS,
  SHOW_EDIT_DIALOG,
  HIDE_EDIT_DIALOG
} from "./actions";

import { LOGOUT } from "../Login/actions";
import { fromAmountString } from "../../helper";
import { HIDE_HISTORY } from "../Notifications/actions";

const defaultState = fromJS({
  id: "",
  displayName: "",
  description: "",
  status: "open",
  amount: 0,
  currency: "EUR",
  created: 0,
  allowedIntents: [],
  workflowItems: [],
  parentProject: {},
  workflowToAdd: {
    id: "",
    displayName: "",
    amount: "",
    amountType: "N/A",
    currency: "",
    description: "",
    status: "open"
  },
  showSubProjectPermissions: false,
  showWorkflowPermissions: false,
  workflowItemReference: "",
  permissions: {},
  creationDialogShown: false,
  editMode: false,
  showDetails: false,
  showDetailsItemId: "",
  showHistory: false,
  currentStep: 0,
  workflowSortEnabled: false,
  workflowType: "workflow",
  workflowApprovalRequired: true,
  subProjectBudgetEditEnabled: false,
  roles: [],
  historyItems: [],
  showWorkflowAssignee: false,
  workflowAssignee: "",
  showSubProjectAssignee: false,
  editDialogShown: false
});

export default function detailviewReducer(state = defaultState, action) {
  switch (action.type) {
    case FETCH_ALL_SUBPROJECT_DETAILS_SUCCESS:
      const { subproject, workflowitems, parentProject } = action;
      return state.merge({
        id: subproject.data.id,
        created: subproject.data.creationUnixTs,
        displayName: subproject.data.displayName,
        description: subproject.data.description,
        status: subproject.data.status,
        amount: fromAmountString(subproject.data.amount),
        currency: subproject.data.currency,
        allowedIntents: fromJS(subproject.allowedIntents),
        assignee: fromJS(subproject.data.assignee),
        workflowItems: fromJS(workflowitems),
        parentProject: fromJS(parentProject)
      });
    case SHOW_EDIT_DIALOG:
      return state.merge({
        workflowToAdd: state
          .getIn(["workflowToAdd"])
          .set("id", action.id)
          .set("displayName", action.displayName)
          .set("amount", action.amount)
          .set("amountType", action.amountType)
          .set("description", action.description)
          .set("currency", action.currency),
        editDialogShown: true
      });
    case HIDE_EDIT_DIALOG:
      return state.merge({
        workflowToAdd: defaultState.getIn(["workflowToAdd"]),
        editDialogShown: false,
        currentStep: defaultState.get("currentStep")
      });
    case SHOW_CREATE_DIALOG:
      return state.merge({
        creationDialogShown: action.show,
        editMode: action.editMode
      });
    case HIDE_CREATE_DIALOG:
      return state.merge({
        creationDialogShown: action.show,
        workflowToAdd: defaultState.getIn(["workflowToAdd"]),
        editMode: defaultState.get("editMode"),
        currentStep: defaultState.get("currentStep")
      });
    case SHOW_SUBPROJECT_PERMISSIONS:
      return state.merge({
        permissions: fromJS({}),
        showSubProjectPermissions: true,
        showWorkflowPermissions: false
      });
    case SHOW_WORKFLOWITEM_PERMISSIONS:
      return state.merge({
        workflowItemReference: action.wId,
        permissions: fromJS({}),
        showSubProjectPermissions: false,
        showWorkflowPermissions: true
      });
    case HIDE_WORKFLOWITEM_PERMISSIONS:
      return state.merge({
        workflowItemReference: defaultState.getIn(["workflowItemReference"]),
        showWorkflowPermissions: false
      });
    case HIDE_SUBPROJECT_PERMISSIONS:
      return state.set("showSubProjectPermissions", false);
    case FETCH_SUBPROJECT_PERMISSIONS_SUCCESS:
    case FETCH_WORKFLOWITEM_PERMISSIONS_SUCCESS:
      return state.set("permissions", fromJS(action.permissions));
    case WORKFLOW_CREATION_STEP:
      return state.set("currentStep", action.step);
    case WORKFLOW_NAME:
      return state.setIn(["workflowToAdd", "displayName"], action.name);
    case WORKFLOW_AMOUNT:
      return state.setIn(["workflowToAdd", "amount"], action.amount);
    case WORKFLOW_AMOUNT_TYPE:
      return state.setIn(["workflowToAdd", "amountType"], action.amountType);
    case WORKFLOW_PURPOSE:
      return state.setIn(["workflowToAdd", "description"], action.description);
    case WORKFLOW_CURRENCY:
      return state.setIn(["workflowToAdd", "currency"], action.currency);
    case WORKFLOW_STATUS:
      return state.setIn(["workflowToAdd", "status"], action.status);
    case SUBPROJECT_AMOUNT:
      return state.set("subProjectAmount", action.amount);
    case CREATE_WORKFLOW_SUCCESS:
    case EDIT_WORKFLOW_ITEM_SUCCESS:
      return state.merge({
        workflowToAdd: defaultState.getIn(["workflowToAdd"]),
        workflowState: defaultState.get("workflowState"),
        editMode: defaultState.get("editMode")
      });
    case SHOW_WORKFLOW_DETAILS:
      return state.merge({
        showDetails: action.show
      });
    case ENABLE_WORKFLOW_SORT:
      return state.set("workflowSortEnabled", action.sortEnabled);
    case UPDATE_WORKFLOW_SORT:
      return state.merge({
        workflowItems: action.workflowItems
      });
    case ENABLE_BUDGET_EDIT:
      return state.set("subProjectBudgetEditEnabled", action.budgetEditEnabled);
    case SHOW_WORKFLOW_ASSIGNEES:
      return state.merge({
        showWorkflowAssignee: true,
        workflowItemReference: action.workflowId,
        workflowAssignee: action.assignee
      });
    case HIDE_WORKFLOW_ASSIGNEES:
      return state.merge({
        showWorkflowAssignee: false,
        workflowItemReference: defaultState.getIn(["workflowItemReference"]),
        workflowAssignee: defaultState.getIn("workflowAssignee")
      });
    case SHOW_SUBPROJECT_ASSIGNEES:
      return state.set("showSubProjectAssignee", true);
    case HIDE_SUBPROJECT_ASSIGNEES:
      return state.set("showSubProjectAssignee", false);
    case FETCH_SUBPROJECT_HISTORY_SUCCESS:
      return state.set("historyItems", fromJS(action.events));
    case HIDE_HISTORY:
      return state.set("historyItems", fromJS([]));
    case LOGOUT:
      return defaultState;
    default:
      return state;
  }
}
