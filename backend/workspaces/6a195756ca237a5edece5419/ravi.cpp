#include<bits/stdc++.h>
using namespace std;

class node{
public:
    int data;
    node* next;

    node(int val){
        data = val;
        next = NULL;
    }
};

void insertattail(node* &head, int data)
{
    node* new_node = new node(data);

    // agar list empty hai
    if(head == NULL){
        head = new_node;
        return;
    }

    node* temp = head;

    while(temp->next != NULL)
    {
        temp = temp->next;
    }

    temp->next = new_node;
}

void display(node* head)
{
    node* temp = head;

    while(temp != NULL)
    {
        cout << temp->data << "->";
        temp = temp->next;
    }

    cout << "NULL" << endl;
}
node* reverse(node* &head)
{
    node* prevptr = NULL;
    node* currptr = head;
    node* nextptr;

    while(currptr != NULL)
    {
        nextptr = currptr->next; // next ptr ko store karlo
        currptr->next = prevptr; // current ptr ka next ko prev ptr se point karlo

        // pointers ko aage badhao
        prevptr = currptr;
        currptr = nextptr;
    }

    return prevptr; // new head of the reversed list
}
// 



int main()
{
    node* head = NULL;

    insertattail(head,10);
    insertattail(head,20);
    insertattail(head,30);
    insertattail(head,40);

    display(head);
    node* newhead = reverse(head);
    display(newhead);

    return 0;
}