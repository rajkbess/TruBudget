import React from 'react';
import { SortableElement } from 'react-sortable-hoc';
import {
  Table,
  TableBody,
  TableRow,
  TableRowColumn
} from 'material-ui/Table';
import { Card } from 'material-ui/Card';
import { toAmountString, statusMapping } from '../../helper.js';
import InfoIcon from 'material-ui/svg-icons/action/info-outline';
import Paper from 'material-ui/Paper';
import OpenIcon from 'material-ui/svg-icons/navigation/close';
import InprogressIcon from 'material-ui/svg-icons/navigation/subdirectory-arrow-right';
import DoneIcon from 'material-ui/svg-icons/navigation/check';
import EditIcon from 'material-ui/svg-icons/image/edit';

import IconButton from 'material-ui/IconButton';
import { ACMECorpLightgrey, ACMECorpSuperLightgreen } from '../../colors.js';

const styles = {
  in_progress: {
    backgroundColor: ACMECorpLightgrey
  },
  done: {
    backgroundColor: ACMECorpSuperLightgreen
  },
  listText: {
    fontSize: '14px'
  },
  open: {},
  dots: {
    height: 20,
    width: 20,
    textAlign: 'center',
    display: 'inline-block',
    position: 'absolute',
    top: '14px',
    left: '-35px',
  },
  line: {
    position: 'absolute',
    borderLeft: '2px',
    borderLeftStyle: 'solid',
    borderLeftColor: 'black',
    height: '100%',
    left: '-26px',
    bottom: '30px',
  },
  firstLine: {
    position: 'absolute',
    borderLeft: '2px solid',
    borderLeftColor: 'black',
    height: '34px',
    left: '-26px',
    bottom: '30px',
  },
  editButtons: {
    minWidth: '40px',
    marginLeft: '5px',
    marginRight: '5px',
    backgroundColor: 'white'
  },
  infoButton: {
    minWidth: '40px',
    marginLeft: '5px',
    marginRight: '5px',
  }
}


const createLine = (isFirst, selectable) => {
  const lineStyle = isFirst ? styles.firstLine : { ...styles.line, opacity: selectable ? 1 : 0.2 };

  return (
    <div style={lineStyle}></div>
  )
};

const getEditButtons = (status = 'open', role, editCB, progressCB) => {
  const statusMapping = {
    open: {
      tooltip: 'Start Workflow',
      icon: InprogressIcon
    },
    'in_progress': {
      tooltip: 'Finish Workflow',
      icon: DoneIcon
    }
  }
  const Icon = statusMapping[status].icon;

  return (
    <TableRowColumn colSpan={2}>
      <IconButton
        disabled={!role.write}
        onTouchTap={() => editCB()}>
        <EditIcon />
      </IconButton>
      <IconButton
        disabled={!role.write}
        onTouchTap={() => progressCB()}>
        <Icon />
      </IconButton>
    </TableRowColumn>
  )
}

const StepDot = ({ status, selectable }) => {
  let Icon;
  switch (status) {
    case 'open':
      Icon = OpenIcon;
      break;
    case 'in_progress':
      Icon = InprogressIcon;
      break;
    case 'done':
      Icon = DoneIcon;
      break;
    default:
      Icon = OpenIcon;
  }
  return (
    <Paper style={styles.dots} zDepth={2} circle={true}>
      <Icon style={{ width: '14px', height: '20px', opacity: selectable ? 1 : 0.3 }} />
    </Paper>
  )
};


const editWorkflow = ({ key, txid, data }, props) => {
  const { amount, currency, purpose, addData, assignee, status } = data;
  props.storeWorkflowName(key)
  props.storeWorkflowAmount(amount)
  props.storeWorkflowCurrency(currency)
  props.storeWorkflowPurpose(purpose)
  props.storeWorkflowAdditionalData(addData)
  props.storeWorkflowAssignee(assignee)
  props.enableWorkflowState()
  props.storeWorkflowState(status)
  props.storeWorkflowTxid(txid)
  props.openWorkflowDialog(true)
}

const changeProgress = ({ key, txid, data }, props) => {
  const { amount, currency, purpose, addData, assignee, status } = data;

  const nextStatus = status === 'open' ? 'in_progress' : 'done';
  props.editWorkflowItem(props.location.pathname.split('/')[3], key, amount, currency, purpose, addData, nextStatus, assignee, txid, data)
}

const WorkflowItem = SortableElement(({ workflow, mapIndex, props, index }) => {
  let nextWorkflowNotSelectable = false;
  const status = workflow.data.status;
  const currentWorkflowSelectable = !nextWorkflowNotSelectable;
  if (!nextWorkflowNotSelectable) nextWorkflowNotSelectable = status === 'open' || status === 'in_progress'
  const amount = toAmountString(workflow.data.amount, workflow.data.currency);
  const tableStyle = currentWorkflowSelectable ? styles[status] : { ...styles[status], opacity: 0.3 };

  return (
    <Card key={mapIndex} style={{
      marginLeft: '50px',
      marginRight: '10px',
      marginTop: '15px',
      marginBottom: '15px',
      position: 'relative',
    }}>

      {createLine(mapIndex === 0, currentWorkflowSelectable)}
      <StepDot status={status} selectable={currentWorkflowSelectable} />

      <Table>
        <TableBody displayRowCheckbox={false} adjustForCheckbox={false}>


          <TableRow style={tableStyle} selectable={false} disabled={currentWorkflowSelectable}>
            <TableRowColumn colSpan={1}>
              <IconButton
                style={styles.infoButton}
                onTouchTap={() => props.openWorkflowDetails(workflow.txid)}>
                <InfoIcon />
              </IconButton>
            </TableRowColumn>
            <TableRowColumn style={styles.listText} colSpan={4}>{workflow.key}</TableRowColumn>
            <TableRowColumn style={styles.listText} colSpan={2}>{amount}</TableRowColumn>
            <TableRowColumn style={styles.listText} colSpan={2}>{statusMapping[status]}</TableRowColumn>
            {currentWorkflowSelectable && status !== 'done' ? getEditButtons(status, props.loggedInUser.role, () => editWorkflow(workflow, props), () => changeProgress(workflow, props)) : <TableRowColumn colSpan={2} />}
          </TableRow>


        </TableBody>
      </Table>
    </Card>
  )
});

export default WorkflowItem;
