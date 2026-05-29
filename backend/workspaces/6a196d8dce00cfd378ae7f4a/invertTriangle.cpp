#include<bits/stdc++.h>
using namespace std;

int main()
{
    for (int i = 0; i < 4; i++) // rows
    {

        for (int k = 0; k < i; k++) // spaces
        {
            cout << "  ";
        }
        

        for (int j = 0; j < 4 - i; j++)// inverted triangle
        {
            cout << "* ";
        }
        
        cout << endl;
    }
    
    return 0;
}