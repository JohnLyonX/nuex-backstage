<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="课程章节" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入课程章节"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item>
	    <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['edu:coursesChapter:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="el-icon-sort"
          size="mini"
          @click="toggleExpandAll"
        >展开/折叠</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table
      v-if="refreshTable"
      v-loading="loading"
      :data="coursesChapterList"
      row-key="id"
      :default-expand-all="isExpandAll"
      :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
    >
      <el-table-column label="课程章节" align="center" prop="title" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['edu:coursesChapter:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-plus"
            @click="handleAdd(scope.row)"
            v-hasPermi="['edu:coursesChapter:add']"
          >新增</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['edu:coursesChapter:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加或修改课程章节信息对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="课程编号" prop="coursesId">
          <el-input v-model="form.coursesId" placeholder="请输入课程编号" :disabled="form.parentId !== 0"/>
        </el-form-item>
        <el-form-item label="课程章节" prop="title">
          <el-input v-model="form.title" placeholder="请输入课程章节" />
        </el-form-item>
        <el-form-item label="父ID" prop="parentId">
          <treeselect v-model="form.parentId" :options="coursesChapterOptions" :normalizer="normalizer" placeholder="请选择父ID" @input="handleParentChange" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listCoursesChapter, getCoursesChapter, delCoursesChapter, addCoursesChapter, updateCoursesChapter } from "@/api/edu/coursesChapter";
import Treeselect from "@riophae/vue-treeselect";
import "@riophae/vue-treeselect/dist/vue-treeselect.css";

export default {
  name: "CoursesChapter",
  components: {
    Treeselect
  },
  data() {
    return {
      // 遮罩层
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 课程章节信息表格数据
      coursesChapterList: [],
      // 课程章节信息树选项
      coursesChapterOptions: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 是否展开，默认全部展开
      isExpandAll: true,
      // 重新渲染表格状态
      refreshTable: true,
      // 查询参数
      queryParams: {
        title: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        coursesId: [
          { required: true, message: "课程编号不能为空", trigger: "blur" }
        ],
        parentId: [
          { required: true, message: "父ID不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询课程章节信息列表 */
    getList() {
      this.loading = true;
      listCoursesChapter(this.queryParams).then(response => {
        this.coursesChapterList = this.handleTree(response.data, "id", "parentId");
        this.loading = false;
      });
    },
    /** 转换课程章节信息数据结构 */
    normalizer(node) {
      if (node.children && !node.children.length) {
        delete node.children;
      }
      return {
        id: node.id,
        label: node.title,
        children: node.children
      };
    },
	/** 查询课程章节信息下拉树结构 */
    getTreeselect() {
      return listCoursesChapter().then(response => {
        this.coursesChapterOptions = [];
        const data = { id: 0, title: '顶级节点',coursesId: response.data.length > 0 ? response.data[0].coursesId : null, children: [] };
        data.children = this.handleTree(response.data, "id", "parentId");
        this.coursesChapterOptions.push(data);
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        coursesId: null,
        title: null,
        parentId: null
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    handleParentChange(parentId) {
      if (parentId === 0) {
        // 父ID是顶级节点：清空课程编号，允许用户输入
        this.form.coursesId = null;
      } else {
        // 父ID非顶级节点：查找父节点并继承coursesId
        const parentNode = this.findNodeById(this.coursesChapterOptions, parentId);
        if (parentNode) {
          this.form.coursesId = parentNode.coursesId;
        }
      }
    },
    findNodeById(nodes, id) {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = this.findNodeById(node.children, id);
          if (found) return found;
        }
      }
      return null;
    },
    /** 新增按钮操作 */
    handleAdd(row) {
      this.reset();
      this.getTreeselect().then(() => { // 确保树数据加载完成
        if (row?.id) {
          this.form.parentId = row.id;
          // 继承父节点课程编号
          const parentNode = this.findNodeById(this.coursesChapterOptions, row.id);
          if (parentNode) this.form.coursesId = parentNode.coursesId;
        } else {
          this.form.parentId = 0;
        }
        this.open = true;
        this.title = "添加课程章节信息";
      });
    },

    /** 展开/折叠操作 */
    toggleExpandAll() {
      this.refreshTable = false;
      this.isExpandAll = !this.isExpandAll;
      this.$nextTick(() => {
        this.refreshTable = true;
      });
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      this.getTreeselect().then(() => {
        getCoursesChapter(row.id).then(response => {
          this.form = response.data;
          if (this.form.parentId !== 0) {
            // 非顶级节点：继承父节点课程编号
            const parentNode = this.findNodeById(this.coursesChapterOptions, this.form.parentId);
            if (parentNode) this.form.coursesId = parentNode.coursesId;
          }
          this.open = true;
          this.title = "修改课程章节信息";
        });
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateCoursesChapter(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addCoursesChapter(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      this.$modal.confirm('是否确认删除课程章节信息编号为"' + row.id + '"的数据项？').then(function() {
        return delCoursesChapter(row.id);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    }
  }
};
</script>
