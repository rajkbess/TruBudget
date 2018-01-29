import React, { Component } from 'react';
import AutoComplete from 'material-ui/AutoComplete';
import Chip from 'material-ui/Chip';
import _ from 'lodash';
import strings from '../../localizeStrings'

const styles = {
  container: {
    display: 'flex',
    flex: 1,
  },
  chip: {
    margin: '4px',
    height: '32px'
  },
  chipWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
}

const dataSourceConfig = {
  text: 'displayName',
  value: 'role',
};

class RoleSelectionContent extends Component {
  state = {
    searchText: '',
  }

  createChips = (selectedRoles) => selectedRoles.map((role, index) => {
    return (
      <Chip
        key={index}
        style={styles.chip}
        onRequestDelete={() => this.onRemoveChip(role)}
      >{role.displayName}</Chip>
    )
  })

  onSelect = (role, index) => {
    if (index > -1) {
      this.setState({
        searchText: '',
      });
      this.props.addSelection(role);
    }
  }

  captureEnterClick = (event) => {
    if (event.charCode === 13) {
      const unSelectedDataSource = _.differenceBy(this.props.dataSource, this.props.selections);
      const index = unSelectedDataSource.findIndex((role) => role.organization.toLowerCase() === _.trim(this.state.searchText).toLowerCase())
      if (index > -1) {
        const role = unSelectedDataSource[index];
        this.onSelect(role, index);
      }
    }
  }

  onRemoveChip = (role) => {
    this.props.removeSelection(role);
  }

  handleUpdateInput = (text) => {
    this.setState({
      searchText: text
    })
  }

  mapDataSource = (dataSource) => (
    dataSource.map(item => {
      return { "role": item.role, organization: item.organization, "displayName": `${item.organization} (${item.role})` }
    })
  )


  render = () => {
    const mappedDataSource = this.mapDataSource(this.props.dataSource)
    const unSelectedDataSource = _.differenceBy(mappedDataSource, this.props.selections);
    return (
      <div style={styles.container}>
        <AutoComplete
          ref="autoComplete"
          aria-label="roleselection"
          onKeyPress={this.captureEnterClick}
          floatingLabelText={strings.project.project_authority_organization_search}
          searchText={this.state.searchText}
          dataSource={unSelectedDataSource}
          onNewRequest={this.onSelect}
          onUpdateInput={this.handleUpdateInput}
          filter={AutoComplete.fuzzyFilter}
          dataSourceConfig={dataSourceConfig}
          menuCloseDelay={0}
        />
        <div style={styles.chipWrapper}>
          {this.createChips(this.props.selections)}
        </div>
      </div >
    )
  }
}

export default RoleSelectionContent;
